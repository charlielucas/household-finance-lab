import assert from "node:assert/strict";
import test from "node:test";

import {
  amortizedPayment,
  calculateOverview,
  createDashboardBundle,
  normalizeScenario,
} from "../lib/model.ts";
import { createDemoLedger, DEFAULT_SCENARIO, DEMO_SEED } from "../lib/seed.ts";

test("the fictional ledger is deterministic and anchored to one public seed", () => {
  const first = createDemoLedger();
  const second = createDemoLedger();
  assert.deepEqual(first, second);
  assert.equal(first.seed, DEMO_SEED);
  assert.equal(first.trends.length, 12);
  assert.equal(first.obligations.length, 8);
});

test("normalizes scenario values at the server trust boundary", () => {
  const scenario = normalizeScenario({
    reliableNetMonthly: Number.POSITIVE_INFINITY,
    variableGrossMonthly: -100,
    variableTaxRate: 99,
    flexibleWeeklyCap: 25,
    fixedCostAdjustment: 9_999,
    cashFloor: -1,
    financing: {
      purpose: "not-valid",
      amount: 999_999,
      annualRate: -4,
      termMonths: 55,
      originationFeeRate: 20,
      fixedRate: "yes",
      prepaymentPenalty: null,
    },
  });

  assert.equal(scenario.reliableNetMonthly, DEFAULT_SCENARIO.reliableNetMonthly);
  assert.equal(scenario.variableGrossMonthly, 0);
  assert.equal(scenario.variableTaxRate, 45);
  assert.equal(scenario.flexibleWeeklyCap, 100);
  assert.equal(scenario.fixedCostAdjustment, 2_500);
  assert.equal(scenario.cashFloor, 0);
  assert.equal(scenario.financing.purpose, "home-project");
  assert.equal(scenario.financing.amount, 100_000);
  assert.equal(scenario.financing.annualRate, 0);
  assert.equal(scenario.financing.termMonths, DEFAULT_SCENARIO.financing.termMonths);
  assert.equal(scenario.financing.originationFeeRate, 10);
});

test("builds a finite 13-week runway and reconciles core outputs", () => {
  const bundle = createDashboardBundle();
  assert.equal(bundle.metrics.weekly.length, 13);
  assert.ok(bundle.metrics.weekly.every((week) => Number.isFinite(week.endingBalance)));
  assert.equal(bundle.metrics.runwayEndBalance, bundle.metrics.weekly.at(-1).endingBalance);
  assert.equal(
    bundle.metrics.protectedCash,
    bundle.ledger.cash.taxReserve + bundle.ledger.cash.healthReserve,
  );
  assert.ok(bundle.metrics.lowestWeek >= 1 && bundle.metrics.lowestWeek <= 13);
  assert.ok(bundle.metrics.weeklySafeToSpend >= 0);
  assert.ok(bundle.metrics.weeklySafeToSpend <= bundle.scenario.flexibleWeeklyCap);
});

test("a stronger income scenario improves the runway", () => {
  const ledger = createDemoLedger();
  const conservative = calculateOverview(ledger, normalizeScenario({
    ...DEFAULT_SCENARIO,
    reliableNetMonthly: 6_000,
    variableGrossMonthly: 250,
    fixedCostAdjustment: 500,
  }));
  const growth = calculateOverview(ledger, normalizeScenario({
    ...DEFAULT_SCENARIO,
    reliableNetMonthly: 10_000,
    variableGrossMonthly: 2_500,
    fixedCostAdjustment: 0,
  }));
  assert.ok(growth.runwayEndBalance > conservative.runwayEndBalance);
  assert.ok(growth.income.monthlyMargin > conservative.income.monthlyMargin);
});

test("fixed amortization handles zero and positive rates", () => {
  assert.equal(amortizedPayment(12_000, 0, 12), 1_000);
  assert.equal(amortizedPayment(0, 8, 48), 0);
  const payment = amortizedPayment(20_000, 8, 48);
  assert.ok(payment > 480 && payment < 500);
});

test("quote gate reacts to rate structure and penalties", () => {
  const baseline = createDashboardBundle();
  const weakQuote = createDashboardBundle({
    ...baseline.scenario,
    financing: {
      ...baseline.scenario.financing,
      fixedRate: false,
      prepaymentPenalty: true,
      originationFeeRate: 6,
    },
  });
  assert.ok(weakQuote.metrics.financing.score < baseline.metrics.financing.score);
  assert.equal(weakQuote.metrics.financing.checks.find((check) => check.id === "fixed-rate")?.passed, false);
  assert.equal(weakQuote.metrics.financing.checks.find((check) => check.id === "penalty")?.passed, false);
});
