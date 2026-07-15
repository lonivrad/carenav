# Accessibility

CareNav targets **WCAG 2.1 Level AA**. Accessibility is checked automatically
on every push and pull request, not just by hand.

## Automated audit

`e2e/a11y.spec.ts` (run with `npm run test:a11y`) boots the app and drives the
real rendered pages through [`@axe-core/playwright`] in Chromium. The report
page is audited by seeding a schema-valid report into `sessionStorage` — the
same store the app uses — so no paid pipeline call is needed. The suite is wired
into CI (`.github/workflows/ci.yml`, "Accessibility (axe-core)" step).

- Tooling: `@axe-core/playwright` 4.12.1 (axe-core engine 4.12.1),
  `@playwright/test` 1.61.1.
- Rules: tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.
- Pages covered: **`/intake`** (questionnaire) and **`/report/[id]`** (a
  fully-populated report).
- Result: **0 violations** on both pages.

### Violations found and fixed

| # | Page | Rule | Impact | Fix |
|---|---|---|---|---|
| 1 | `/intake` | `aria-progressbar-name` (WCAG 1.1.1) | serious | The questionnaire progress bar (`role="progressbar"`) had no accessible name. Added `aria-label="Question {step} of {total}"` in `src/components/intake/ProgressBar.tsx`. |

No other violations were reported. The audit now passes clean on both pages.

## Colour contrast (navy/teal palette)

Palette from `src/app/globals.css`. Ratios computed against WCAG thresholds
(AA: 4.5:1 normal / 3:1 large; AAA: 7:1 normal / 4.5:1 large).

| Foreground | Background | Ratio | Normal | Large |
|---|---|---|---|---|
| Body text `#141312` | White `#ffffff` | 18.56:1 | AAA | AAA |
| Navy accent `#1b3a5c` (headings, links) | White `#ffffff` | 11.63:1 | AAA | AAA |
| Teal secondary `#3e7c8c` | White `#ffffff` | 4.70:1 | AA | AAA |
| White `#ffffff` | Navy `#1b3a5c` (buttons, dark surfaces) | 11.63:1 | AAA | AAA |
| White `#ffffff` | Teal `#3e7c8c` (hover/secondary surfaces) | 4.70:1 | AA | AAA |

Every foreground/background pair in use meets at least WCAG AA for normal text.
The teal secondary (`#3e7c8c`) is the tightest at **4.70:1** — it clears AA for
normal text and AAA for large text, so it is safe for the badge and hover uses
it carries; it should not be dropped below this value or used for text smaller
than the body size without re-checking.

## Keyboard navigation and visible focus

- **Confirmed automatically.** `e2e/a11y.spec.ts` tabs into `/intake`, asserts
  focus lands on a real interactive control (reachable by keyboard), and asserts
  that control shows a visible focus indicator (a non-zero `outline` ring or a
  focus `box-shadow`). This test passes.
- Interactive elements across the app use Tailwind `focus-visible:outline-2
  focus-visible:outline-offset-2 focus-visible:outline-accent` (navy ring,
  11.63:1 against white), so the focus ring is keyboard-only and high-contrast.
  Present on intake answer controls and skip actions (`QuestionStep`,
  `IntakeFlow`, `ReviewScreen`) and on report links and disclosures
  (`ProgramCard`, `ReportSummary`, `CitationLink`, the report page).
- Disclosure sections in the report use native `<details>`/`<summary>`, which
  are keyboard-operable by default.

## Running locally

```bash
npm run test:a11y          # boots the app and runs the axe + keyboard suite
npx playwright install chromium   # one-time, if the browser isn't present
```
