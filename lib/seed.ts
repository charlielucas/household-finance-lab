import type { DemoLedger, ScenarioInput } from "./types.ts";

export const DEMO_SEED = 731_947;

function mulberry32(seed: number) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 2 ** 32;
  };
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

export const DEFAULT_SCENARIO: ScenarioInput = {
  reliableNetMonthly: 7_800,
  variableGrossMonthly: 1_250,
  variableTaxRate: 28,
  flexibleWeeklyCap: 510,
  fixedCostAdjustment: 0,
  cashFloor: 8_000,
  financing: {
    purpose: "home-project",
    amount: 16_500,
    annualRate: 7.75,
    termMonths: 48,
    originationFeeRate: 1.5,
    fixedRate: true,
    prepaymentPenalty: false,
  },
};

export function createDemoLedger(): DemoLedger {
  const random = mulberry32(DEMO_SEED);
  const monthLabels = [
    "Feb 2025",
    "Mar 2025",
    "Apr 2025",
    "May 2025",
    "Jun 2025",
    "Jul 2025",
    "Aug 2025",
    "Sep 2025",
    "Oct 2025",
    "Nov 2025",
    "Dec 2025",
    "Jan 2026",
  ];

  let assets = 173_800;
  let liabilities = 139_600;
  const trends = monthLabels.map((month, index) => {
    const seasonalSpend = index === 9 ? 1_050 : index === 10 ? 1_800 : 0;
    const income = rounded(8_000 + random() * 1_750 + (index % 4 === 0 ? 650 : 0));
    const spending = rounded(6_450 + random() * 1_150 + seasonalSpend);
    assets = rounded(assets + Math.max(-300, income - spending) * 0.62 + 460 + random() * 220);
    liabilities = rounded(Math.max(0, liabilities - 720 - random() * 180));
    return { month, income, spending, assets, liabilities };
  });

  return {
    seed: DEMO_SEED,
    asOf: "2026-01-05T08:00:00.000Z",
    anchorMonday: "2026-01-05",
    householdLabel: "Sample household",
    disclaimer: "Public portfolio demo. Every name, balance, event, and account is fictional.",
    cash: {
      operatingCash: 12_460,
      taxReserve: 4_320,
      healthReserve: 2_180,
    },
    ytdVariableGross: 18_900,
    averageFlexibleWeekly: 578,
    obligations: [
      { id: "home", label: "Home payment", category: "home", dayOfMonth: 1, monthlyAmount: 2_280, essential: true, confidence: "high", sourceId: "seed-ledger" },
      { id: "transport", label: "Transportation", category: "mobility", dayOfMonth: 4, monthlyAmount: 515, essential: true, confidence: "high", sourceId: "seed-ledger" },
      { id: "insurance", label: "Insurance bundle", category: "protection", dayOfMonth: 9, monthlyAmount: 306, essential: true, confidence: "high", sourceId: "seed-ledger" },
      { id: "utilities", label: "Utilities", category: "utilities", dayOfMonth: 12, monthlyAmount: 264, essential: true, confidence: "medium", sourceId: "seed-ledger" },
      { id: "mobile", label: "Mobile service", category: "services", dayOfMonth: 17, monthlyAmount: 132, essential: true, confidence: "high", sourceId: "seed-ledger" },
      { id: "internet", label: "Home internet", category: "services", dayOfMonth: 21, monthlyAmount: 82, essential: true, confidence: "high", sourceId: "seed-ledger" },
      { id: "transit", label: "Transit and parking", category: "mobility", dayOfMonth: 24, monthlyAmount: 148, essential: false, confidence: "medium", sourceId: "seed-ledger" },
      { id: "memberships", label: "Digital memberships", category: "services", dayOfMonth: 27, monthlyAmount: 74, essential: false, confidence: "medium", sourceId: "seed-ledger" },
    ],
    oneOffEvents: [
      { week: 3, label: "Annual protection renewal", amount: 690, confidence: "high" },
      { week: 7, label: "Medical deductible", amount: 420, confidence: "medium" },
      { week: 11, label: "Seasonal home service", amount: 285, confidence: "medium" },
    ],
    trends,
    sources: [
      {
        id: "seed-ledger",
        label: "Seeded demo ledger",
        description: "Deterministic monthly balances, category totals, and recurring obligations generated from one public seed.",
        confidence: "high",
        asOf: "Jan 5, 2026",
      },
      {
        id: "scenario-input",
        label: "Scenario controls",
        description: "User-selected income, tax, spending, cash-floor, and financing assumptions.",
        confidence: "medium",
        asOf: "Current session",
      },
      {
        id: "runway-model",
        label: "13-week runway model",
        description: "Biweekly reliable income, weekly variable income, calendar obligations, one-off events, and a weekly flexible cap.",
        confidence: "modeled",
        asOf: "Calculated on request",
      },
      {
        id: "quote-gate",
        label: "Financing quality gate",
        description: "Transparent rule checks for rate structure, fees, penalties, payment room, and cash-floor preservation.",
        confidence: "modeled",
        asOf: "Calculated on request",
      },
    ],
  };
}
