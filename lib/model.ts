import { createDemoLedger, DEFAULT_SCENARIO } from "./seed.ts";
import type {
  DashboardBundle,
  DemoLedger,
  ExceptionItem,
  FinancingResult,
  FinancingScenario,
  OverviewMetrics,
  ScenarioInput,
  WeekPoint,
} from "./types.ts";

const DAY_MS = 86_400_000;
const WEEKS_PER_MONTH = 52 / 12;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function safeNumber(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, minimum, maximum)
    : fallback;
}

function addDays(date: string, amount: number): string {
  const next = new Date(`${date}T12:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + amount);
  return next.toISOString().slice(0, 10);
}

function monthOccurrences(ledger: DemoLedger): { week: number; amount: number }[] {
  const anchor = new Date(`${ledger.anchorMonday}T12:00:00.000Z`);
  const results: { week: number; amount: number }[] = [];
  const seen = new Set<string>();

  for (let monthOffset = 0; monthOffset < 5; monthOffset += 1) {
    const month = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + monthOffset, 1, 12));
    for (const obligation of ledger.obligations) {
      const due = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), obligation.dayOfMonth, 12));
      const week = Math.floor((due.getTime() - anchor.getTime()) / (7 * DAY_MS)) + 1;
      const key = `${obligation.id}-${due.toISOString().slice(0, 10)}`;
      if (week >= 1 && week <= 13 && !seen.has(key)) {
        results.push({ week, amount: obligation.monthlyAmount });
        seen.add(key);
      }
    }
  }

  return results;
}

export function normalizeScenario(value: unknown): ScenarioInput {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const financingRaw = raw.financing && typeof raw.financing === "object"
    ? raw.financing as Record<string, unknown>
    : {};
  const defaultFinancing = DEFAULT_SCENARIO.financing;
  const purpose = financingRaw.purpose;
  const term = safeNumber(financingRaw.termMonths, defaultFinancing.termMonths, 12, 120);

  return {
    reliableNetMonthly: round(safeNumber(raw.reliableNetMonthly, DEFAULT_SCENARIO.reliableNetMonthly, 2_000, 20_000)),
    variableGrossMonthly: round(safeNumber(raw.variableGrossMonthly, DEFAULT_SCENARIO.variableGrossMonthly, 0, 12_000)),
    variableTaxRate: round(safeNumber(raw.variableTaxRate, DEFAULT_SCENARIO.variableTaxRate, 0, 45)),
    flexibleWeeklyCap: round(safeNumber(raw.flexibleWeeklyCap, DEFAULT_SCENARIO.flexibleWeeklyCap, 100, 2_000)),
    fixedCostAdjustment: round(safeNumber(raw.fixedCostAdjustment, DEFAULT_SCENARIO.fixedCostAdjustment, -1_000, 2_500)),
    cashFloor: round(safeNumber(raw.cashFloor, DEFAULT_SCENARIO.cashFloor, 0, 30_000)),
    financing: {
      purpose: purpose === "vehicle-repair" || purpose === "education" ? purpose : "home-project",
      amount: round(safeNumber(financingRaw.amount, defaultFinancing.amount, 1_000, 100_000)),
      annualRate: round(safeNumber(financingRaw.annualRate, defaultFinancing.annualRate, 0, 36)),
      termMonths: [12, 24, 36, 48, 60, 72, 84, 96, 120].includes(term) ? term : defaultFinancing.termMonths,
      originationFeeRate: round(safeNumber(financingRaw.originationFeeRate, defaultFinancing.originationFeeRate, 0, 10)),
      fixedRate: typeof financingRaw.fixedRate === "boolean" ? financingRaw.fixedRate : defaultFinancing.fixedRate,
      prepaymentPenalty: typeof financingRaw.prepaymentPenalty === "boolean"
        ? financingRaw.prepaymentPenalty
        : defaultFinancing.prepaymentPenalty,
    },
  };
}

export function amortizedPayment(principal: number, annualRatePercent: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return round(principal / months);
  return round(principal * monthlyRate / (1 - (1 + monthlyRate) ** -months));
}

function evaluateFinancing(
  financing: FinancingScenario,
  availablePaymentRoom: number,
  projectedFloorPreserved: boolean,
): FinancingResult {
  const financedAmount = round(financing.amount / (1 - financing.originationFeeRate / 100));
  const monthlyPayment = amortizedPayment(financedAmount, financing.annualRate, financing.termMonths);
  const totalCashPaid = round(monthlyPayment * financing.termMonths);
  const totalFinancingCost = round(totalCashPaid - financing.amount);
  const checks = [
    {
      id: "fixed-rate",
      label: "Fixed rate",
      detail: financing.fixedRate ? "Payment cannot reset with a benchmark rate." : "Variable pricing adds payment uncertainty.",
      passed: financing.fixedRate,
    },
    {
      id: "penalty",
      label: "No prepayment penalty",
      detail: financing.prepaymentPenalty ? "Early payoff may trigger a charge." : "Extra principal can reduce cost without a stated penalty.",
      passed: !financing.prepaymentPenalty,
    },
    {
      id: "fee",
      label: "Fee at or below 3%",
      detail: `${financing.originationFeeRate.toFixed(2)}% is withheld from proceeds.`,
      passed: financing.originationFeeRate <= 3,
    },
    {
      id: "payment-room",
      label: "Payment fits operating room",
      detail: `${round(monthlyPayment / Math.max(availablePaymentRoom, 1) * 100)}% of modeled payment room used.`,
      passed: monthlyPayment <= availablePaymentRoom,
    },
    {
      id: "cash-floor",
      label: "13-week cash floor preserved",
      detail: projectedFloorPreserved ? "The modeled low point stays above the selected floor." : "The modeled low point falls below the selected floor.",
      passed: projectedFloorPreserved,
    },
  ];
  const score = checks.filter((check) => check.passed).length;
  return {
    financedAmount,
    monthlyPayment,
    totalCashPaid,
    totalFinancingCost,
    availablePaymentRoom: round(availablePaymentRoom),
    paymentRoomUsed: round(monthlyPayment / Math.max(availablePaymentRoom, 1) * 100),
    score,
    verdict: score === checks.length ? "ready" : score >= 3 ? "review" : "stop",
    checks,
  };
}

function buildRunway(
  ledger: DemoLedger,
  scenario: ScenarioInput,
  financingPayment: number,
): WeekPoint[] {
  const spendableCash = ledger.cash.operatingCash;
  const obligations = monthOccurrences(ledger);
  const reliablePaycheck = scenario.reliableNetMonthly * 12 / 26;
  const usableVariableWeekly = scenario.variableGrossMonthly * 12 / 52 * (1 - scenario.variableTaxRate / 100);
  const weeklyFixedAdjustment = scenario.fixedCostAdjustment / WEEKS_PER_MONTH;
  const weeklyFinancing = financingPayment / WEEKS_PER_MONTH;
  let balance = spendableCash;

  return Array.from({ length: 13 }, (_, index) => {
    const week = index + 1;
    const income = round((week % 2 === 1 ? reliablePaycheck : 0) + usableVariableWeekly);
    const due = obligations
      .filter((item) => item.week === week)
      .reduce((sum, item) => sum + item.amount, 0);
    const fixed = round(Math.max(0, due + weeklyFixedAdjustment + weeklyFinancing));
    const oneOff = round(
      ledger.oneOffEvents.filter((event) => event.week === week).reduce((sum, event) => sum + event.amount, 0),
    );
    balance = round(balance + income - fixed - scenario.flexibleWeeklyCap - oneOff);
    return {
      week,
      startDate: addDays(ledger.anchorMonday, index * 7),
      endDate: addDays(ledger.anchorMonday, index * 7 + 6),
      income,
      obligations: fixed,
      flexible: scenario.flexibleWeeklyCap,
      oneOff,
      endingBalance: balance,
    };
  });
}

function buildExceptions(
  ledger: DemoLedger,
  scenario: ScenarioInput,
  lowestBalance: number,
  lowestWeek: number,
  taxReserveGap: number,
  financing: FinancingResult,
): ExceptionItem[] {
  const items: ExceptionItem[] = [];
  if (lowestBalance < scenario.cashFloor) {
    items.push({
      id: "cash-floor",
      severity: "critical",
      title: `Cash floor breaks in week ${lowestWeek}`,
      detail: `The modeled low point is ${round(scenario.cashFloor - lowestBalance)} below the selected floor.`,
      action: "Reduce the weekly cap, defer a financing payment, or add reliable income.",
      sourceId: "runway-model",
    });
  }
  if (taxReserveGap > 0) {
    items.push({
      id: "tax-reserve",
      severity: taxReserveGap > 1_250 ? "critical" : "watch",
      title: "Variable-income tax reserve is behind target",
      detail: `${round(taxReserveGap)} remains to reach the selected reserve rate on fictional year-to-date variable income.`,
      action: "Route the next variable-income deposit to the protected tax bucket first.",
      sourceId: "scenario-input",
    });
  }
  if (scenario.flexibleWeeklyCap < ledger.averageFlexibleWeekly) {
    items.push({
      id: "flex-gap",
      severity: "watch",
      title: "Weekly spending behavior must change",
      detail: `The cap is ${round(ledger.averageFlexibleWeekly - scenario.flexibleWeeklyCap)} below the seeded eight-week average.`,
      action: "Choose the two categories that will absorb the reduction before the week starts.",
      sourceId: "seed-ledger",
    });
  }
  if (financing.verdict !== "ready") {
    items.push({
      id: "financing-gate",
      severity: financing.verdict === "stop" ? "critical" : "watch",
      title: `Financing quote needs ${financing.verdict === "stop" ? "a stop" : "review"}`,
      detail: `${financing.score} of ${financing.checks.length} quality checks pass.`,
      action: "Resolve every failed gate before treating the payment as committed.",
      sourceId: "quote-gate",
    });
  }
  const nextEvent = ledger.oneOffEvents[0];
  items.push({
    id: "known-event",
    severity: "note",
    title: `${nextEvent.label} is already modeled`,
    detail: `${nextEvent.amount} lands in week ${nextEvent.week}; it is included in the runway, not a surprise buffer.`,
    action: "Confirm the amount during the weekly review.",
    sourceId: "seed-ledger",
  });
  return items;
}

export function calculateOverview(ledger: DemoLedger, input: ScenarioInput): OverviewMetrics {
  const scenario = normalizeScenario(input);
  const baseFixed = ledger.obligations.reduce((sum, item) => sum + item.monthlyAmount, 0);
  const fixedObligations = Math.max(0, baseFixed + scenario.fixedCostAdjustment);
  const flexiblePlan = scenario.flexibleWeeklyCap * WEEKS_PER_MONTH;
  const usableVariable = scenario.variableGrossMonthly * (1 - scenario.variableTaxRate / 100);
  const usableIncome = scenario.reliableNetMonthly + usableVariable;
  const provisionalPaymentRoom = Math.max(0, usableIncome - fixedObligations - flexiblePlan - 650);
  const provisionalPayment = amortizedPayment(
    scenario.financing.amount / (1 - scenario.financing.originationFeeRate / 100),
    scenario.financing.annualRate,
    scenario.financing.termMonths,
  );
  const weekly = buildRunway(ledger, scenario, provisionalPayment);
  const lowest = weekly.reduce((current, point) => point.endingBalance < current.endingBalance ? point : current, weekly[0]);
  const financing = evaluateFinancing(
    scenario.financing,
    provisionalPaymentRoom,
    lowest.endingBalance >= scenario.cashFloor,
  );
  const taxReserveTarget = round(ledger.ytdVariableGross * scenario.variableTaxRate / 100);
  const taxReserveGap = round(Math.max(0, taxReserveTarget - ledger.cash.taxReserve));
  const margin = round(usableIncome - fixedObligations - flexiblePlan - financing.monthlyPayment);
  const safeToSpend = round(clamp(
    scenario.flexibleWeeklyCap + Math.min(0, lowest.endingBalance - scenario.cashFloor),
    0,
    scenario.flexibleWeeklyCap,
  ));
  const nextFourteenDayObligations = round(
    weekly.slice(0, 2).reduce((sum, point) => sum + point.obligations + point.oneOff, 0),
  );

  return {
    spendableCash: ledger.cash.operatingCash,
    protectedCash: ledger.cash.taxReserve + ledger.cash.healthReserve,
    weeklySafeToSpend: safeToSpend,
    lowestBalance: lowest.endingBalance,
    lowestWeek: lowest.week,
    runwayEndBalance: weekly.at(-1)?.endingBalance ?? ledger.cash.operatingCash,
    nextFourteenDayObligations,
    fixedCostRatio: round(fixedObligations / Math.max(scenario.reliableNetMonthly, 1) * 100),
    taxReserveTarget,
    taxReserveGap,
    weekly,
    financing,
    income: {
      reliableNet: scenario.reliableNetMonthly,
      variableGross: scenario.variableGrossMonthly,
      variableTaxSetAside: round(scenario.variableGrossMonthly * scenario.variableTaxRate / 100),
      variableUsable: round(usableVariable),
      usableIncome: round(usableIncome),
      fixedObligations: round(fixedObligations),
      flexiblePlan: round(flexiblePlan),
      financingPayment: financing.monthlyPayment,
      monthlyMargin: margin,
    },
    exceptions: buildExceptions(ledger, scenario, lowest.endingBalance, lowest.week, taxReserveGap, financing),
  };
}

export function createDashboardBundle(input: unknown = DEFAULT_SCENARIO): DashboardBundle {
  const ledger = createDemoLedger();
  const scenario = normalizeScenario(input);
  return { ledger, scenario, metrics: calculateOverview(ledger, scenario) };
}
