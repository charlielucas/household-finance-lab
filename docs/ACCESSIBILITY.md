# Accessibility

## Implemented foundations

- semantic header, navigation, main, sections, tables, lists, and footer;
- skip link to the primary content;
- visible `:focus-visible` treatment;
- minimum 44-pixel button and form-control targets;
- explicit labels and value text for range controls;
- pressed-state semantics for presets, filters, chart points, and acknowledgements;
- one concise polite live region after successful scenario calculation;
- retained last-good state plus an inline alert on request failure;
- chart buttons with exact accessible names;
- table alternatives for the 13-week projection;
- horizontally scrollable dense charts and tables with keyboard-focusable containers;
- text labels in addition to color for exceptions, confidence, and gate results;
- reduced-motion support;
- responsive single-column reflow;
- print rules that remove controls and preserve the review content.

## Manual QA checklist

- [ ] Complete the primary flow using Tab, Shift+Tab, Enter, Space, and arrow keys inside native controls.
- [ ] Verify focus remains visible at 200% browser zoom.
- [ ] Test VoiceOver with Safari and NVDA with Firefox or Chrome.
- [ ] Confirm chart names and the runway table communicate equivalent information.
- [ ] Test 320 CSS-pixel width without two-dimensional page scrolling.
- [ ] Verify high-contrast mode and forced colors.
- [ ] Run automated checks with axe or an equivalent tool.
- [ ] Review all text and UI-component color pairs against WCAG 2.2 AA.
- [ ] Confirm error and pending states remain understandable without color.

## Known limits

- No external screen-reader or assistive-technology pass has been completed in this local-only version.
- Native range inputs vary across browsers and require platform QA.
- The interactive chart bars are buttons rather than a formal composite widget; each is independently tabbable.
- Print behavior has source-level rules but still needs browser-output inspection.

No claim of full WCAG conformance is made.
