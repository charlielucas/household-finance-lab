"use client";

import { useMemo, useState } from "react";
import type {
  DashboardBundle,
  ExceptionItem,
  FinancingScenario,
  ScenarioInput,
  WeekPoint,
} from "../lib/types.ts";

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const exactDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactDollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const PRESETS: Record<string, Partial<ScenarioInput>> = {
  baseline: {
    reliableNetMonthly: 7_800,
    variableGrossMonthly: 1_250,
    variableTaxRate: 28,
    flexibleWeeklyCap: 510,
    fixedCostAdjustment: 0,
    cashFloor: 8_000,
  },
  conservative: {
    reliableNetMonthly: 6_850,
    variableGrossMonthly: 600,
    variableTaxRate: 30,
    flexibleWeeklyCap: 440,
    fixedCostAdjustment: 300,
    cashFloor: 9_000,
  },
  stretch: {
    reliableNetMonthly: 8_550,
    variableGrossMonthly: 1_900,
    variableTaxRate: 28,
    flexibleWeeklyCap: 565,
    fixedCostAdjustment: 0,
    cashFloor: 8_500,
  },
};

type ExceptionFilter = "all" | ExceptionItem["severity"];

function dateLabel(value: string): string {
  return shortDate.format(new Date(`${value}T12:00:00.000Z`));
}

function confidenceLabel(value: string): string {
  return value === "modeled" ? "Model" : `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <p>{copy}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  source = "Modeled",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "good" | "warn";
  source?: string;
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-meta"><span>{label}</span><i>{source}</i></div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function ScenarioRange({
  label,
  value,
  minimum,
  maximum,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="scenario-range">
      <span><b>{label}</b><strong>{display}</strong></span>
      <input
        type="range"
        min={minimum}
        max={maximum}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <small><span>{minimum.toLocaleString()}</span><span>{maximum.toLocaleString()}</span></small>
    </label>
  );
}

function WeekInspector({ week }: { week: WeekPoint }) {
  const net = week.income - week.obligations - week.flexible - week.oneOff;
  return (
    <aside className="week-inspector" aria-label={`Week ${week.week} details`}>
      <div>
        <p className="eyebrow">Selected week</p>
        <h3>Week {week.week} · {dateLabel(week.startDate)}–{dateLabel(week.endDate)}</h3>
      </div>
      <dl>
        <div><dt>Income</dt><dd>+{dollars.format(week.income)}</dd></div>
        <div><dt>Obligations</dt><dd>−{dollars.format(week.obligations)}</dd></div>
        <div><dt>Flexible plan</dt><dd>−{dollars.format(week.flexible)}</dd></div>
        <div><dt>Known one-offs</dt><dd>−{dollars.format(week.oneOff)}</dd></div>
        <div className={net >= 0 ? "positive" : "negative"}><dt>Weekly change</dt><dd>{net >= 0 ? "+" : "−"}{dollars.format(Math.abs(net))}</dd></div>
        <div><dt>Ending operating cash</dt><dd>{dollars.format(week.endingBalance)}</dd></div>
      </dl>
    </aside>
  );
}

export default function Dashboard({ initialBundle }: { initialBundle: DashboardBundle }) {
  const [bundle, setBundle] = useState(initialBundle);
  const [draft, setDraft] = useState(initialBundle.scenario);
  const [running, setRunning] = useState(false);
  const [scenarioError, setScenarioError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedTrend, setSelectedTrend] = useState(initialBundle.ledger.trends.length - 1);
  const [exceptionFilter, setExceptionFilter] = useState<ExceptionFilter>("all");
  const [acknowledged, setAcknowledged] = useState<string[]>([]);

  const { ledger, metrics, scenario } = bundle;
  const hasPendingChanges = JSON.stringify(draft) !== JSON.stringify(scenario);
  const maxRunway = Math.max(...metrics.weekly.map((week) => week.endingBalance), scenario.cashFloor, 1);
  const runwayFloorPosition = Math.min(100, scenario.cashFloor / maxRunway * 100);
  const selectedWeekPoint = metrics.weekly[selectedWeek] ?? metrics.weekly[0];
  const trend = ledger.trends[selectedTrend] ?? ledger.trends.at(-1)!;
  const maxTrendCashFlow = Math.max(...ledger.trends.flatMap((point) => [point.income, point.spending]), 1);
  const maxNetWorth = Math.max(...ledger.trends.map((point) => point.assets - point.liabilities), 1);
  const currentNetWorth = trend.assets - trend.liabilities;
  const filteredExceptions = metrics.exceptions.filter((item) => exceptionFilter === "all" || item.severity === exceptionFilter);
  const monthlyObligations = ledger.obligations.reduce((sum, item) => sum + item.monthlyAmount, 0) + scenario.fixedCostAdjustment;
  const waterfallMaximum = Math.max(
    metrics.income.usableIncome,
    metrics.income.fixedObligations,
    metrics.income.flexiblePlan,
    metrics.income.monthlyMargin,
    1,
  );
  const sourceMap = useMemo(() => new Map(ledger.sources.map((source) => [source.id, source])), [ledger.sources]);

  function updateFinancing(next: Partial<FinancingScenario>) {
    setDraft((current) => ({ ...current, financing: { ...current.financing, ...next } }));
  }

  async function runScenario(next: ScenarioInput = draft) {
    setRunning(true);
    setScenarioError("");
    try {
      const response = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error("Scenario request failed");
      const nextBundle = await response.json() as DashboardBundle;
      setBundle(nextBundle);
      setDraft(nextBundle.scenario);
      setSelectedWeek(0);
      setAnnouncement(
        `Scenario updated. Weekly cap ${dollars.format(nextBundle.metrics.weeklySafeToSpend)}. Lowest balance ${dollars.format(nextBundle.metrics.lowestBalance)} in week ${nextBundle.metrics.lowestWeek}.`,
      );
    } catch {
      setScenarioError("The scenario could not be recalculated. The last successful view is still shown.");
    } finally {
      setRunning(false);
    }
  }

  function applyPreset(name: keyof typeof PRESETS) {
    const next = { ...draft, ...PRESETS[name], financing: draft.financing };
    setDraft(next);
    void runScenario(next);
  }

  function toggleAcknowledged(id: string) {
    setAcknowledged((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to financial overview</a>
      <header className="site-header">
        <nav className="nav-shell" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="Weekmark Household Lab home">
            <span>WM</span>
            <strong>WEEKMARK<small>HOUSEHOLD LAB</small></strong>
          </a>
          <div className="nav-links">
            <a href="#cockpit">Cockpit</a>
            <a href="#signals">Signals</a>
            <a href="#income">Income</a>
            <a href="#decisions">Decisions</a>
            <a href="#trends">Trends</a>
          </div>
          <span className="demo-chip">Seeded public demo</span>
        </nav>
      </header>

      <main id="main-content">
        <section className="hero" id="top">
          <div className="demo-notice" role="note">
            <b>Fictional by design</b>
            <span>{ledger.disclaimer}</span>
            <code>seed {ledger.seed}</code>
          </div>
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Weekly operating view · {ledger.householdLabel}</p>
              <h1>Make the next seven days boring—in a good way.</h1>
              <p>
                A deterministic household-finance lab for testing cash runway, variable-income taxes,
                recurring obligations, and financing choices without exposing real financial data.
              </p>
              <div className="hero-actions">
                <a className="primary-action" href="#cockpit">Open weekly cockpit</a>
                <a className="secondary-action" href="#methods">Read the model</a>
              </div>
            </div>
            <div className="hero-status">
              <div className="hero-status-top">
                <span>Safe flexible cap · week 1</span>
                <i className={metrics.weeklySafeToSpend >= scenario.flexibleWeeklyCap ? "stable" : "pressure"}>
                  {metrics.weeklySafeToSpend >= scenario.flexibleWeeklyCap ? "Inside guardrails" : "Needs adjustment"}
                </i>
              </div>
              <strong>{dollars.format(metrics.weeklySafeToSpend)}</strong>
              <div className="hero-status-grid">
                <div><span>Operating cash</span><b>{dollars.format(metrics.spendableCash)}</b></div>
                <div><span>Protected cash</span><b>{dollars.format(metrics.protectedCash)}</b></div>
                <div><span>13-week low</span><b>{dollars.format(metrics.lowestBalance)}</b></div>
                <div><span>Monthly margin</span><b className={metrics.income.monthlyMargin < 0 ? "negative-text" : "positive-text"}>{dollars.format(metrics.income.monthlyMargin)}</b></div>
              </div>
              <p>Modeled on the server from fixed seeded data and the active scenario.</p>
            </div>
          </div>
        </section>

        <section className="scenario-studio" aria-labelledby="scenario-title">
          <div className="scenario-heading">
            <div>
              <p className="eyebrow">Scenario studio</p>
              <h2 id="scenario-title">Change the assumptions, not the evidence.</h2>
              <p>All controls are bounded and recomputed through the local API. Nothing is persisted.</p>
            </div>
            <div className="preset-buttons" aria-label="Scenario presets">
              <button type="button" onClick={() => applyPreset("conservative")}>Conservative</button>
              <button type="button" onClick={() => applyPreset("baseline")}>Baseline</button>
              <button type="button" onClick={() => applyPreset("stretch")}>Growth</button>
            </div>
          </div>
          <div className="scenario-controls">
            <ScenarioRange label="Reliable net / month" value={draft.reliableNetMonthly} minimum={2_000} maximum={14_000} step={100} display={dollars.format(draft.reliableNetMonthly)} onChange={(value) => setDraft((current) => ({ ...current, reliableNetMonthly: value }))} />
            <ScenarioRange label="Variable gross / month" value={draft.variableGrossMonthly} minimum={0} maximum={6_000} step={50} display={dollars.format(draft.variableGrossMonthly)} onChange={(value) => setDraft((current) => ({ ...current, variableGrossMonthly: value }))} />
            <ScenarioRange label="Variable-income reserve" value={draft.variableTaxRate} minimum={0} maximum={45} step={1} display={`${draft.variableTaxRate}%`} onChange={(value) => setDraft((current) => ({ ...current, variableTaxRate: value }))} />
            <ScenarioRange label="Flexible weekly cap" value={draft.flexibleWeeklyCap} minimum={150} maximum={1_100} step={10} display={dollars.format(draft.flexibleWeeklyCap)} onChange={(value) => setDraft((current) => ({ ...current, flexibleWeeklyCap: value }))} />
            <ScenarioRange label="Fixed-cost adjustment" value={draft.fixedCostAdjustment} minimum={-500} maximum={1_500} step={25} display={`${draft.fixedCostAdjustment >= 0 ? "+" : "−"}${dollars.format(Math.abs(draft.fixedCostAdjustment))}`} onChange={(value) => setDraft((current) => ({ ...current, fixedCostAdjustment: value }))} />
            <ScenarioRange label="Operating cash floor" value={draft.cashFloor} minimum={2_000} maximum={15_000} step={250} display={dollars.format(draft.cashFloor)} onChange={(value) => setDraft((current) => ({ ...current, cashFloor: value }))} />
          </div>
          <div className="scenario-submit">
            <p>{hasPendingChanges ? "Pending changes are not yet reflected below." : "Dashboard and controls are synchronized."}</p>
            <button type="button" onClick={() => void runScenario()} disabled={running || !hasPendingChanges}>
              {running ? "Recalculating…" : hasPendingChanges ? "Run scenario" : "Scenario current"}
            </button>
          </div>
          {scenarioError && <p className="scenario-error" role="alert">{scenarioError}</p>}
          <p className="sr-only" aria-live="polite">{announcement}</p>
        </section>

        <section className="page-section cockpit" id="cockpit">
          <SectionHeading
            eyebrow="01 · Weekly cockpit"
            title="The whole plan has one job: preserve optionality."
            copy="The default view starts with the next decision window, then lets the reader inspect the 13-week consequence."
          />
          <div className="metric-grid">
            <MetricCard label="Safe flexible cap" value={dollars.format(metrics.weeklySafeToSpend)} detail={`Selected plan is ${dollars.format(scenario.flexibleWeeklyCap)} per week.`} tone={metrics.weeklySafeToSpend >= scenario.flexibleWeeklyCap ? "good" : "warn"} />
            <MetricCard label="Lowest projected cash" value={dollars.format(metrics.lowestBalance)} detail={`Week ${metrics.lowestWeek}; floor is ${dollars.format(scenario.cashFloor)}.`} tone={metrics.lowestBalance >= scenario.cashFloor ? "good" : "warn"} />
            <MetricCard label="Next 14 days committed" value={dollars.format(metrics.nextFourteenDayObligations)} detail="Calendar obligations plus known one-off events." source="Seed + model" />
            <MetricCard label="Fixed-cost load" value={`${metrics.fixedCostRatio.toFixed(1)}%`} detail="Monthly fixed obligations divided by reliable net income." tone={metrics.fixedCostRatio <= 55 ? "good" : "warn"} />
          </div>

          <div className="runway-layout">
            <div className="panel runway-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">13-week operating cash</p><h3>Where does cash get tight?</h3></div>
                <div className="chart-key"><span><i className="key-stable" />Above floor</span><span><i className="key-pressure" />Below floor</span></div>
              </div>
              <div className="chart-scroll" tabIndex={0} aria-label="Scrollable 13-week operating cash chart">
                <div className="runway-chart" style={{ "--floor-position": `${runwayFloorPosition}%` } as React.CSSProperties}>
                  <span className="floor-line" aria-hidden="true"><i>cash floor</i></span>
                  {metrics.weekly.map((week, index) => {
                    const height = Math.max(3, Math.max(0, week.endingBalance) / maxRunway * 100);
                    const pressure = week.endingBalance < scenario.cashFloor;
                    return (
                      <button
                        type="button"
                        key={week.week}
                        className={`${pressure ? "pressure" : "stable"} ${selectedWeek === index ? "selected" : ""}`}
                        aria-pressed={selectedWeek === index}
                        aria-label={`Week ${week.week}, ending operating cash ${dollars.format(week.endingBalance)}`}
                        onClick={() => setSelectedWeek(index)}
                      >
                        <span className="runway-bar-track" aria-hidden="true"><i style={{ height: `${height}%` }} /></span>
                        <b>W{week.week}</b>
                        <small>{compactDollars.format(week.endingBalance)}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
              <details className="data-details">
                <summary>View 13-week projection table</summary>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Week</th><th>Income</th><th>Obligations</th><th>Flexible</th><th>One-offs</th><th>Ending cash</th></tr></thead>
                    <tbody>{metrics.weekly.map((week) => (
                      <tr key={week.week}><th scope="row">Week {week.week}</th><td>{exactDollars.format(week.income)}</td><td>{exactDollars.format(week.obligations)}</td><td>{exactDollars.format(week.flexible)}</td><td>{exactDollars.format(week.oneOff)}</td><td>{exactDollars.format(week.endingBalance)}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </details>
            </div>
            <WeekInspector week={selectedWeekPoint} />
          </div>
        </section>

        <section className="page-section signals-section" id="signals">
          <SectionHeading
            eyebrow="02 · Exception inbox"
            title="Review what changed, not every number."
            copy="Signals are derived from transparent thresholds. Acknowledging one changes only this browser session."
          />
          <div className="signal-toolbar">
            <div className="signal-filters" role="group" aria-label="Filter exceptions">
              {(["all", "critical", "watch", "note"] as ExceptionFilter[]).map((filter) => (
                <button key={filter} type="button" aria-pressed={exceptionFilter === filter} className={exceptionFilter === filter ? "active" : ""} onClick={() => setExceptionFilter(filter)}>
                  {filter === "all" ? "All" : confidenceLabel(filter)}
                </button>
              ))}
            </div>
            <span>{filteredExceptions.length} visible · {acknowledged.length} acknowledged</span>
          </div>
          <div className="exception-list">
            {filteredExceptions.map((item) => {
              const isAcknowledged = acknowledged.includes(item.id);
              return (
                <article key={item.id} className={`exception ${item.severity} ${isAcknowledged ? "acknowledged" : ""}`}>
                  <div className="severity"><span>{item.severity}</span><i>{sourceMap.get(item.sourceId)?.label ?? "Model"}</i></div>
                  <div><h3>{item.title}</h3><p>{item.detail}</p><strong>{item.action}</strong></div>
                  <button type="button" aria-pressed={isAcknowledged} onClick={() => toggleAcknowledged(item.id)}>{isAcknowledged ? "Reopen" : "Acknowledge"}</button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="page-section income-section" id="income">
          <SectionHeading
            eyebrow="03 · Income + tax waterfall"
            title="Variable income is useful only after its reserve is protected."
            copy="The waterfall keeps reliable net income separate from modeled variable gross and makes the tax set-aside visible."
          />
          <div className="income-layout">
            <div className="panel waterfall-panel">
              <div className="panel-heading"><div><p className="eyebrow">Monthly operating waterfall</p><h3>From inflow to margin</h3></div><span className="confidence-chip">Scenario + model</span></div>
              <div className="waterfall">
                {[
                  { label: "Reliable net", value: metrics.income.reliableNet, tone: "income" },
                  { label: "Variable gross", value: metrics.income.variableGross, tone: "variable" },
                  { label: "Tax set-aside", value: -metrics.income.variableTaxSetAside, tone: "protected" },
                  { label: "Fixed obligations", value: -metrics.income.fixedObligations, tone: "fixed" },
                  { label: "Flexible plan", value: -metrics.income.flexiblePlan, tone: "flex" },
                  { label: "Financing scenario", value: -metrics.income.financingPayment, tone: "finance" },
                  { label: "Monthly margin", value: metrics.income.monthlyMargin, tone: metrics.income.monthlyMargin >= 0 ? "margin" : "deficit" },
                ].map((item) => (
                  <div className="waterfall-row" key={item.label}>
                    <span>{item.label}</span>
                    <div className="waterfall-track" aria-hidden="true"><i className={item.tone} style={{ width: `${Math.max(2, Math.abs(item.value) / waterfallMaximum * 100)}%` }} /></div>
                    <b className={item.value < 0 ? "negative-text" : ""}>{item.value < 0 ? "−" : "+"}{dollars.format(Math.abs(item.value))}</b>
                  </div>
                ))}
              </div>
            </div>
            <aside className="tax-card">
              <div className="tax-ring" style={{ "--tax-progress": `${Math.min(100, ledger.cash.taxReserve / Math.max(metrics.taxReserveTarget, 1) * 100)}%` } as React.CSSProperties}>
                <span><b>{Math.min(100, Math.round(ledger.cash.taxReserve / Math.max(metrics.taxReserveTarget, 1) * 100))}%</b>funded</span>
              </div>
              <div>
                <p className="eyebrow">Variable-income reserve</p>
                <h3>{dollars.format(ledger.cash.taxReserve)} protected</h3>
                <dl><div><dt>Seeded YTD gross</dt><dd>{dollars.format(ledger.ytdVariableGross)}</dd></div><div><dt>Selected target</dt><dd>{dollars.format(metrics.taxReserveTarget)}</dd></div><div><dt>Gap</dt><dd>{dollars.format(metrics.taxReserveGap)}</dd></div></dl>
                <p>This is a planning reserve, not tax advice or a return calculation.</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="page-section decisions-section" id="decisions">
          <SectionHeading
            eyebrow="04 · Obligations + financing decisions"
            title="A payment is affordable only when the calendar and the quote agree."
            copy="Recurring costs stay separate from a generalized financing-quality gate so the dashboard remains useful beyond debt payoff."
          />
          <div className="obligation-summary">
            <div><span>Monthly obligations</span><strong>{dollars.format(monthlyObligations)}</strong><small>{metrics.fixedCostRatio.toFixed(1)}% of reliable net</small></div>
            <div><span>Essential share</span><strong>{Math.min(100, Math.round(ledger.obligations.filter((item) => item.essential).reduce((sum, item) => sum + item.monthlyAmount, 0) / Math.max(monthlyObligations, 1) * 100))}%</strong><small>Seeded recurring obligations</small></div>
            <div><span>Financing payment</span><strong>{dollars.format(metrics.financing.monthlyPayment)}</strong><small>{metrics.financing.paymentRoomUsed.toFixed(0)}% of payment room</small></div>
          </div>
          <div className="decision-grid">
            <div className="panel timeline-panel">
              <div className="panel-heading"><div><p className="eyebrow">Fixed-cost calendar</p><h3>One month, ordered by due day</h3></div><span className="confidence-chip">Seeded</span></div>
              <ol className="obligation-timeline">
                {ledger.obligations.map((item) => (
                  <li key={item.id}>
                    <time dateTime={`2026-01-${String(item.dayOfMonth).padStart(2, "0")}`}>{String(item.dayOfMonth).padStart(2, "0")}</time>
                    <div><span>{item.label}</span><small>{item.category} · {item.essential ? "essential" : "reviewable"}</small></div>
                    <b>{dollars.format(item.monthlyAmount)}</b>
                    <i className={`confidence-dot ${item.confidence}`} title={`${confidenceLabel(item.confidence)} confidence`} />
                  </li>
                ))}
              </ol>
            </div>

            <div className="panel financing-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">Financing quality gate</p><h3>Test a household decision</h3></div>
                <span className={`verdict ${metrics.financing.verdict}`}>{metrics.financing.verdict}</span>
              </div>
              <div className="financing-controls">
                <label><span>Purpose</span><select value={draft.financing.purpose} onChange={(event) => updateFinancing({ purpose: event.target.value as FinancingScenario["purpose"] })}><option value="home-project">Home project</option><option value="vehicle-repair">Vehicle repair</option><option value="education">Education</option></select></label>
                <label><span>Amount</span><input type="number" min="1000" max="100000" step="500" value={draft.financing.amount} onChange={(event) => updateFinancing({ amount: Number(event.target.value) })} /></label>
                <label><span>Rate</span><div className="input-suffix"><input type="number" min="0" max="36" step="0.25" value={draft.financing.annualRate} onChange={(event) => updateFinancing({ annualRate: Number(event.target.value) })} /><i>%</i></div></label>
                <label><span>Term</span><select value={draft.financing.termMonths} onChange={(event) => updateFinancing({ termMonths: Number(event.target.value) })}>{[24, 36, 48, 60, 72, 84].map((term) => <option key={term} value={term}>{term} months</option>)}</select></label>
                <label><span>Fee</span><div className="input-suffix"><input type="number" min="0" max="10" step="0.25" value={draft.financing.originationFeeRate} onChange={(event) => updateFinancing({ originationFeeRate: Number(event.target.value) })} /><i>%</i></div></label>
                <label className="check-control"><input type="checkbox" checked={draft.financing.fixedRate} onChange={(event) => updateFinancing({ fixedRate: event.target.checked })} /><span>Fixed rate</span></label>
                <label className="check-control"><input type="checkbox" checked={draft.financing.prepaymentPenalty} onChange={(event) => updateFinancing({ prepaymentPenalty: event.target.checked })} /><span>Prepayment penalty</span></label>
              </div>
              <div className="quote-output">
                <div><span>Modeled payment</span><strong>{exactDollars.format(metrics.financing.monthlyPayment)}</strong></div>
                <div><span>Financing cost</span><strong>{dollars.format(metrics.financing.totalFinancingCost)}</strong></div>
                <div><span>Quality score</span><strong>{metrics.financing.score}/{metrics.financing.checks.length}</strong></div>
              </div>
              <div className="quality-checks">
                {metrics.financing.checks.map((check) => <div className={check.passed ? "pass" : "fail"} key={check.id}><span>{check.passed ? "Pass" : "Fail"}</span><p><b>{check.label}</b><small>{check.detail}</small></p></div>)}
              </div>
              {hasPendingChanges && <p className="pending-note">Run the scenario to apply the edited quote.</p>}
            </div>
          </div>
        </section>

        <section className="page-section trends-section" id="trends">
          <SectionHeading
            eyebrow="05 · Movement over time"
            title="Direction matters more than a single snapshot."
            copy="Twelve deterministic months show income versus spending and a reconstructed asset-minus-liability position."
          />
          <div className="trend-summary">
            <div><span>{trend.month}</span><strong>{dollars.format(currentNetWorth)}</strong><small>seeded net position</small></div>
            <div><span>Monthly inflow</span><strong>{dollars.format(trend.income)}</strong><small>{trend.income >= trend.spending ? "above spending" : "below spending"}</small></div>
            <div><span>Monthly spending</span><strong>{dollars.format(trend.spending)}</strong><small>{dollars.format(Math.abs(trend.income - trend.spending))} difference</small></div>
          </div>
          <div className="trend-grid">
            <div className="panel trend-panel">
              <div className="panel-heading"><div><p className="eyebrow">Income versus spending</p><h3>Monthly movement</h3></div><span className="confidence-chip">Seeded</span></div>
              <div className="chart-scroll" tabIndex={0} aria-label="Scrollable monthly cash-flow chart">
                <div className="cashflow-chart">
                  {ledger.trends.map((point, index) => (
                    <button key={point.month} type="button" aria-pressed={selectedTrend === index} className={selectedTrend === index ? "selected" : ""} onClick={() => setSelectedTrend(index)} aria-label={`${point.month}: income ${dollars.format(point.income)}, spending ${dollars.format(point.spending)}`}>
                      <span><i className="income-bar" style={{ height: `${point.income / maxTrendCashFlow * 100}%` }} /><i className="spend-bar" style={{ height: `${point.spending / maxTrendCashFlow * 100}%` }} /></span><b>{point.month.split(" ")[0]}</b>
                    </button>
                  ))}
                </div>
              </div>
              <div className="chart-key"><span><i className="key-income" />Income</span><span><i className="key-spend" />Spending</span></div>
            </div>
            <div className="panel trend-panel">
              <div className="panel-heading"><div><p className="eyebrow">Net position</p><h3>Assets minus liabilities</h3></div><span className="confidence-chip">Reconstructed</span></div>
              <div className="chart-scroll" tabIndex={0} aria-label="Scrollable net-position chart">
                <div className="networth-chart">
                  {ledger.trends.map((point, index) => {
                    const net = point.assets - point.liabilities;
                    return <button key={point.month} type="button" aria-pressed={selectedTrend === index} className={selectedTrend === index ? "selected" : ""} onClick={() => setSelectedTrend(index)} aria-label={`${point.month}: net position ${dollars.format(net)}`}><span aria-hidden="true"><i style={{ height: `${net / maxNetWorth * 100}%` }} /></span><b>{point.month.split(" ")[0]}</b></button>;
                  })}
                </div>
              </div>
              <dl className="trend-breakdown"><div><dt>Assets</dt><dd>{dollars.format(trend.assets)}</dd></div><div><dt>Liabilities</dt><dd>{dollars.format(trend.liabilities)}</dd></div><div><dt>Net position</dt><dd>{dollars.format(currentNetWorth)}</dd></div></dl>
            </div>
          </div>
        </section>

        <section className="page-section methods-section" id="methods">
          <SectionHeading
            eyebrow="06 · Provenance + confidence"
            title="Every number should explain where it came from."
            copy="The public demo separates seeded evidence, current-session assumptions, and calculated outputs."
          />
          <div className="source-grid">
            {ledger.sources.map((source) => (
              <article key={source.id}>
                <div><span>{source.label}</span><i className={source.confidence}>{confidenceLabel(source.confidence)}</i></div>
                <p>{source.description}</p>
                <small>As of {source.asOf}</small>
              </article>
            ))}
          </div>
          <div className="method-notes">
            <article><span>Determinism</span><h3>Same seed, same ledger.</h3><p>The generator contains no clock reads, network calls, browser state, or private inputs. Tests assert repeatable output.</p></article>
            <article><span>Privacy boundary</span><h3>Aggregate demo data only.</h3><p>No merchant, payee, memo, account number, token, credential, statement, or transaction row exists in the data model.</p></article>
            <article><span>Model limit</span><h3>Planning support, not advice.</h3><p>Tax, financing, and runway outputs are transparent examples for product engineering—not individualized recommendations.</p></article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="brand"><span>WM</span><strong>WEEKMARK<small>HOUSEHOLD LAB</small></strong></div>
        <p>Clean-room public portfolio project · deterministic fictional data · no external connections</p>
        <a href="#top">Back to top</a>
      </footer>
    </>
  );
}
