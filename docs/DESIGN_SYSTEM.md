# Weekmark interface system

## Purpose and boundary

This is a code-first, public design system for the Weekmark Household Lab. It makes the product easier to read, change, and verify without implying that any screen contains a real person's finances. The living reference is available at `/system`; its values and examples are deterministic and fictional.

The source of truth is the code in `app/globals.css`, `app/ui/primitives.tsx`, and `app/system/`. This document records the contracts those files implement.

## Foundations

### Token families

| Family | Examples | Use |
| --- | --- | --- |
| Brand | `--blue`, `--blue-dark`, `--mint` | Primary action and positive emphasis |
| Semantic status | `--status-positive`, `--status-warning`, `--status-negative`, `--status-info` | Meaningful state, always paired with text |
| Surfaces and text | `--surface`, `--surface-raised`, `--text-primary`, `--text-secondary` | Layers and readable hierarchy |
| Space | `--space-1` through `--space-6` | Gaps, padding, and density decisions |
| Shape and elevation | `--radius-sm`, `--radius-md`, `--elevation-1`, `--elevation-2` | Deliberate grouping rather than decorative variation |
| Motion and focus | `--duration-fast`, `--duration-standard`, `--easing-standard`, `--focus-ring` | Feedback that remains visible and respects reduced motion |

Weekmark's blue/mint identity is deliberately scoped to this public, synthetic demo. Tokens name visual roles so that brand adjustments do not require rewriting a component's behavior.

### Layout and type

- Use the display face for major decisions and the sans face for explanation.
- Use the mono face for compact labels, evidence, dates, and bounded numeric controls.
- Start with one clear decision in a section heading, then place context in a short supporting sentence.
- Build desktop grids with `minmax(0, …)` and collapse to a single readable column before content becomes cramped.
- Prefer borders, spacing, and hierarchy over large shadows or decorative illustration.

## Shared components

`app/ui/primitives.tsx` exports the baseline components.

| Component | Variants / states | Contract |
| --- | --- | --- |
| `SectionHeading` | one layout | Supplies eyebrow, decision-oriented heading, and supporting context. |
| `MetricCard` | `neutral`, `good`, `warn` | Pairs a value with a visible provenance label and detail. |
| `ScenarioRange` | bounded native range | Wraps the native input in a real label, shows its formatted value, and states both endpoints. |
| `StatusBadge` | `neutral`, `positive`, `warning`, `negative`, `info` | Uses visible wording; it must never rely on color alone. |
| `ActionButton` | `primary`, `secondary`, `quiet` | Native button with at least a 44-pixel target and visible focus. |

The `/system` route demonstrates those components plus composition patterns for segmented choices, chart/table pairs, and feedback states.

## Interaction and feedback

- Use native buttons, labels, `<details>`, tables, and landmarks before adding ARIA.
- A selected segmented choice uses `aria-pressed`; it does not move focus or trigger unrelated navigation.
- Keep the last successful result visible while an update is loading or errors.
- State whether data is seeded, modeled, current-session input, stale, or unknown. Do not invent freshness or confidence.
- When a chart conveys a decision, supply an equivalent table or text alternative in the same feature.
- Use `aria-live` sparingly and only for concise updates resulting from a person's action.

## Accessibility and responsive contract

- Meet WCAG 2.1 AA contrast requirements for text and controls.
- Preserve a visible keyboard focus ring and an in-page skip link.
- Keep interactive controls at least 44 by 44 CSS pixels.
- Test the dashboard and `/system` at 1440, 960, 720, 390, and 320 CSS pixels. At narrow widths, stack primary decisions above supporting detail and let wide data tables scroll inside a labeled container.
- Do not use color, hover, title attributes, or a tooltip as the only way to understand a status.
- Honor `prefers-reduced-motion` and do not put time-sensitive information in animation.

## Change process

1. Add or adjust semantic tokens before adding one-off color, spacing, or radius values.
2. Document a component's variants, states, keyboard behavior, and screen-reader behavior in the same change.
3. Add a deterministic test when a route, privacy boundary, or component contract becomes material.
4. Run lint, typecheck, tests, production build, and responsive visual review before publishing.

The system is intentionally lightweight: it improves real product surfaces without becoming a second, disconnected demo application.
