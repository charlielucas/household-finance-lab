export type Confidence = "high" | "medium" | "modeled";

export type SourceNote = {
  id: string;
  label: string;
  description: string;
  confidence: Confidence;
  asOf: string;
};

export type CashPosition = {
  operatingCash: number;
  taxReserve: number;
  healthReserve: number;
};

export type Obligation = {
  id: string;
  label: string;
  category: "home" | "mobility" | "utilities" | "protection" | "services";
  dayOfMonth: number;
  monthlyAmount: number;
  essential: boolean;
  confidence: Confidence;
  sourceId: string;
};

export type OneOffEvent = {
  week: number;
  label: string;
  amount: number;
  confidence: Confidence;
};

export type TrendPoint = {
  month: string;
  income: number;
  spending: number;
  assets: number;
  liabilities: number;
};

export type DemoLedger = {
  seed: number;
  asOf: string;
  anchorMonday: string;
  householdLabel: string;
  disclaimer: string;
  cash: CashPosition;
  ytdVariableGross: number;
  averageFlexibleWeekly: number;
  obligations: Obligation[];
  oneOffEvents: OneOffEvent[];
  trends: TrendPoint[];
  sources: SourceNote[];
};

export type FinancingScenario = {
  purpose: "home-project" | "vehicle-repair" | "education";
  amount: number;
  annualRate: number;
  termMonths: number;
  originationFeeRate: number;
  fixedRate: boolean;
  prepaymentPenalty: boolean;
};

export type ScenarioInput = {
  reliableNetMonthly: number;
  variableGrossMonthly: number;
  variableTaxRate: number;
  flexibleWeeklyCap: number;
  fixedCostAdjustment: number;
  cashFloor: number;
  financing: FinancingScenario;
};

export type WeekPoint = {
  week: number;
  startDate: string;
  endDate: string;
  income: number;
  obligations: number;
  flexible: number;
  oneOff: number;
  endingBalance: number;
};

export type QualityCheck = {
  id: string;
  label: string;
  detail: string;
  passed: boolean;
};

export type FinancingResult = {
  financedAmount: number;
  monthlyPayment: number;
  totalCashPaid: number;
  totalFinancingCost: number;
  availablePaymentRoom: number;
  paymentRoomUsed: number;
  score: number;
  verdict: "ready" | "review" | "stop";
  checks: QualityCheck[];
};

export type ExceptionItem = {
  id: string;
  severity: "critical" | "watch" | "note";
  title: string;
  detail: string;
  action: string;
  sourceId: string;
};

export type IncomeWaterfall = {
  reliableNet: number;
  variableGross: number;
  variableTaxSetAside: number;
  variableUsable: number;
  usableIncome: number;
  fixedObligations: number;
  flexiblePlan: number;
  financingPayment: number;
  monthlyMargin: number;
};

export type OverviewMetrics = {
  spendableCash: number;
  protectedCash: number;
  weeklySafeToSpend: number;
  lowestBalance: number;
  lowestWeek: number;
  runwayEndBalance: number;
  nextFourteenDayObligations: number;
  fixedCostRatio: number;
  taxReserveTarget: number;
  taxReserveGap: number;
  weekly: WeekPoint[];
  financing: FinancingResult;
  income: IncomeWaterfall;
  exceptions: ExceptionItem[];
};

export type DashboardBundle = {
  ledger: DemoLedger;
  scenario: ScenarioInput;
  metrics: OverviewMetrics;
};
