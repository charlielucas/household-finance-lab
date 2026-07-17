"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ActionButton,
  MetricCard,
  ScenarioRange,
  SectionHeading,
  StatusBadge,
} from "../ui/primitives";
import styles from "./system-showcase.module.css";

type FeedbackState = "ready" | "loading" | "stale" | "empty" | "error";

const feedbackCopy: Record<FeedbackState, { title: string; copy: string; tone: "neutral" | "positive" | "warning" | "negative" | "info" }> = {
  ready: { title: "Ready", copy: "The latest synthetic calculation is available to inspect.", tone: "positive" },
  loading: { title: "Recalculating", copy: "Keep the prior result visible while a bounded scenario updates.", tone: "info" },
  stale: { title: "Needs refresh", copy: "Make the evidence date visible before treating a result as current.", tone: "warning" },
  empty: { title: "No matching signals", copy: "Say what the filter found instead of leaving an unexplained blank panel.", tone: "neutral" },
  error: { title: "Last view retained", copy: "Explain the failed action and preserve the last successful result.", tone: "negative" },
};

export default function SystemShowcase() {
  const [selectedPace, setSelectedPace] = useState("balanced");
  const [guardrail, setGuardrail] = useState(64);
  const [feedback, setFeedback] = useState<FeedbackState>("ready");
  const activeFeedback = feedbackCopy[feedback];

  return (
    <>
      <a className="skip-link" href="#system-main">Skip to system reference</a>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="System reference navigation">
          <Link className={styles.brand} href="/" aria-label="Weekmark Household Lab home"><span>WM</span> WEEKMARK</Link>
          <span className={styles.eyebrow}>Public system reference</span>
          <Link className={styles.returnLink} href="/">Open the synthetic demo <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <main className={styles.page} id="system-main" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="system-title">
          <div>
            <p className="eyebrow">System / v1.0</p>
            <h1 id="system-title">Practical patterns for a calm, inspectable planning interface.</h1>
            <p>
              This living reference turns the Weekmark approach into shared tokens, resilient components,
              and explicit states. Every example below is fictional and intentionally non-personal.
            </p>
          </div>
          <aside className={styles.scope} aria-label="System scope">
            <StatusBadge tone="info">Synthetic examples only</StatusBadge>
            <strong>One visual language, clear evidence boundaries.</strong>
            <p>Use the dashboard for the working product and this route to inspect the patterns behind it.</p>
          </aside>
        </section>

        <nav className={styles.sectionNav} aria-label="On this page">
          <a href="#foundations">Foundations</a>
          <a href="#components">Components</a>
          <a href="#patterns">Patterns</a>
          <a href="#states">States</a>
        </nav>

        <section className={styles.section} id="foundations" aria-labelledby="foundations-title">
          <SectionHeading
            eyebrow="01 / Foundations"
            titleId="foundations-title"
            title="Semantic tokens make changes deliberate."
            copy="The public demo keeps brand color separate from meaning, then uses a compact spacing and type scale for predictable reflow."
          />
          <div className={styles.foundationGrid}>
            <article className={styles.tokenPanel}>
              <h3>Color roles</h3>
              <div className={styles.swatches}>
                <div><i className={styles.blue} /><span><b>Action</b>Blue</span></div>
                <div><i className={styles.mint} /><span><b>Positive</b>Mint</span></div>
                <div><i className={styles.amber} /><span><b>Watch</b>Amber</span></div>
                <div><i className={styles.coral} /><span><b>Needs action</b>Coral</span></div>
              </div>
              <p>Every status also names its meaning; color is never the only signal.</p>
            </article>
            <article className={styles.tokenPanel}>
              <h3>Spacing + elevation</h3>
              <div className={styles.spacingScale} aria-label="Spacing scale from 4 to 32 pixels">
                {[4, 8, 12, 16, 24, 32].map((space) => <span key={space} style={{ "--space-width": `${space * 3}px` } as React.CSSProperties}><i />{space}</span>)}
              </div>
              <p>Small gaps group related detail. Larger gaps make section changes legible without decoration.</p>
            </article>
            <article className={styles.tokenPanel}>
              <h3>Type roles</h3>
              <p className={styles.typeDisplay}>Decision first</p>
              <p className={styles.typeBody}>Readable body copy explains context and limits without hiding the next action.</p>
              <p className={styles.typeLabel}>LABEL / EVIDENCE / DATE</p>
            </article>
          </div>
        </section>

        <section className={styles.section} id="components" aria-labelledby="components-title">
          <SectionHeading
            eyebrow="02 / Components"
            titleId="components-title"
            title="Small primitives, consistent behavior."
            copy="The dashboard shares section headings, metric cards, range controls, status badges, and action buttons rather than rebuilding them one section at a time."
          />
          <div className={styles.componentGrid}>
            <article className={styles.componentPanel}>
              <h3>Meaningful status</h3>
              <div className={styles.badgeRow}>
                <StatusBadge tone="positive">On track</StatusBadge>
                <StatusBadge tone="warning">Review soon</StatusBadge>
                <StatusBadge tone="negative">Needs action</StatusBadge>
                <StatusBadge tone="info">Modeled</StatusBadge>
              </div>
              <p>Visible text carries the state even when the colored treatment is unavailable.</p>
            </article>
            <article className={styles.componentPanel}>
              <h3>Action hierarchy</h3>
              <div className={styles.buttonRow}>
                <ActionButton onClick={() => setFeedback("ready")}>Primary action</ActionButton>
                <ActionButton variant="secondary" onClick={() => setFeedback("stale")}>Secondary</ActionButton>
                <ActionButton variant="quiet" onClick={() => setFeedback("empty")}>Quiet action</ActionButton>
              </div>
              <p>All interactive controls have a visible focus treatment and a 44-pixel touch target.</p>
            </article>
            <article className={styles.componentPanel}>
              <h3>Metric card</h3>
              <MetricCard label="Synthetic guardrail" value="64%" detail="A fictional example with explicit modeled provenance." tone="good" source="Synthetic" />
            </article>
          </div>
        </section>

        <section className={styles.section} id="patterns" aria-labelledby="patterns-title">
          <SectionHeading
            eyebrow="03 / Patterns"
            titleId="patterns-title"
            title="An interaction should reveal its consequence."
            copy="Controls retain labels, values, bounds, and a visible summary. Dense data always has an accessible table or text alternative."
          />
          <div className={styles.patternGrid}>
            <article className={styles.patternPanel}>
              <div className={styles.panelHeading}><div><p className="eyebrow">Segmented decision</p><h3>Choose a fictional pacing mode</h3></div><StatusBadge tone="info">Demo control</StatusBadge></div>
              <div className={styles.segmented} role="group" aria-label="Fictional pacing mode">
                {[
                  ["cautious", "Cautious"],
                  ["balanced", "Balanced"],
                  ["accelerated", "Accelerated"],
                ].map(([value, label]) => (
                  <button key={value} type="button" data-active={selectedPace === value} aria-pressed={selectedPace === value} onClick={() => setSelectedPace(value)}>{label}</button>
                ))}
              </div>
              <p className={styles.inlineResult}>Selected: <b>{selectedPace}</b>. The summary updates without moving focus or sending the decision anywhere.</p>
              <ScenarioRange label="Example guardrail" value={guardrail} minimum={20} maximum={90} step={1} display={`${guardrail}%`} onChange={setGuardrail} />
            </article>
            <article className={styles.patternPanel}>
              <div className={styles.panelHeading}><div><p className="eyebrow">Chart + alternative</p><h3>Four fictional periods</h3></div><StatusBadge tone="neutral">Seeded</StatusBadge></div>
              <figure className={styles.figure}>
                <div className={styles.miniChart} aria-hidden="true">
                  {[42, 58, 48, 70].map((height, index) => <span key={height} style={{ "--bar-height": `${height}%` } as React.CSSProperties}><i /><b>P{index + 1}</b></span>)}
                </div>
                <figcaption>Visual comparison only; the table below contains the same fictional values.</figcaption>
              </figure>
              <details className={styles.details}>
                <summary>Open the accessible data table</summary>
                <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Synthetic pacing index data; scroll horizontally">
                  <table>
                    <caption className="sr-only">Synthetic pacing index by fictional period</caption>
                    <thead><tr><th>Period</th><th>Index</th><th>State</th></tr></thead>
                    <tbody>{[42, 58, 48, 70].map((value, index) => <tr key={value}><th scope="row">P{index + 1}</th><td>{value}</td><td>{value >= 60 ? "On track" : "Review"}</td></tr>)}</tbody>
                  </table>
                </div>
              </details>
            </article>
          </div>
        </section>

        <section className={styles.section} id="states" aria-labelledby="states-title">
          <SectionHeading
            eyebrow="04 / Feedback + empty states"
            titleId="states-title"
            title="Never leave a person wondering what changed."
            copy="Loading, stale, empty, and error states preserve context and explain the next useful action in plain language."
          />
          <div className={styles.stateLayout}>
            <div className={styles.stateControls} role="group" aria-label="Preview feedback states">
              {(Object.keys(feedbackCopy) as FeedbackState[]).map((state) => <button key={state} type="button" data-active={feedback === state} aria-pressed={feedback === state} onClick={() => setFeedback(state)}>{state}</button>)}
            </div>
            <article className={styles.feedbackCard} aria-live="polite">
              <StatusBadge tone={activeFeedback.tone}>{activeFeedback.title}</StatusBadge>
              <h3>{activeFeedback.title}</h3>
              <p>{activeFeedback.copy}</p>
              {feedback === "error" && <ActionButton variant="secondary" onClick={() => setFeedback("loading")}>Try again</ActionButton>}
              {feedback === "stale" && <ActionButton variant="secondary" onClick={() => setFeedback("loading")}>Refresh view</ActionButton>}
            </article>
          </div>
          <details className={`${styles.details} ${styles.implementationNotes}`}>
            <summary>Read the implementation contract</summary>
            <ul>
              <li>Use semantic landmarks, native buttons, labels, and disclosures before adding ARIA.</li>
              <li>Keep visible status text, even when a color or icon reinforces the meaning.</li>
              <li>At narrow widths, stack decisions before supporting detail and preserve horizontal table access.</li>
              <li>Use motion only as feedback and honor a reduced-motion preference.</li>
            </ul>
          </details>
        </section>
      </main>
    </>
  );
}
