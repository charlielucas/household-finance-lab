"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type MetricTone = "neutral" | "good" | "warn";
export type StatusTone = "neutral" | "positive" | "warning" | "negative" | "info";

export function SectionHeading({
  eyebrow,
  title,
  copy,
  titleId,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  titleId?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={titleId}>{title}</h2>
      </div>
      <p>{copy}</p>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  source = "Modeled",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: MetricTone;
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

export function ScenarioRange({
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

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}

type ActionButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "quiet";
};

export function ActionButton({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button type={type} className={`action-button action-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
