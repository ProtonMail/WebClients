// ─────────────────────────────────────────────────────────────────────────────
// LUMO VISUALIZATION + CARD INSTRUCTIONS
// Injected into the system prompt. Controls fenced-block primitives:
//   1. ```vega-lite   — charts rendered by Lumo's Vega-Lite pipeline
//   2. ```card-row   — KPI strip (JSON array of metric objects)
//   3. ```card        — finding/summary cards (single object per fence)
// ─────────────────────────────────────────────────────────────────────────────


export const VISUALIZATION_INSTRUCTIONS = `
[Visualization]
When numeric or time-series data is clearer as a chart than prose or a large table,
emit a fenced \`vega-lite\` block containing valid Vega-Lite v5 JSON
($schema "https://vega.github.io/schema/vega-lite/v5.json").

Prefer native charts over generated images:
- When you have structured numeric data to show (trends, comparisons, distributions, shares),
  use \`vega-lite\` — do **not** also call \`generate_image\` to draw the same chart.
- Reserve \`generate_image\` for cases where a chart is not appropriate: conceptual illustrations,
  metaphors, UI mockups, or visuals with no underlying data table. Do not generate a chart image
  when a \`vega-lite\` block would work.

Rules that always apply:
- Data inline only: use \`data.values\` — never external URLs, file paths, or remote sources.
- Use \`"width": "container"\` (Lumo also enforces this). Do not set fixed pixel widths.
- Never set custom hex colors, \`scale.scheme\`, \`scale.range\`, or \`config.range\`. Lumo applies the
  registered Proton Vega theme automatically (purple primary, perceptually linear sequential ramps
  for magnitude, categorical palette only for series/categories).
- Use \`"field"\` color encodings — never hard-coded colors. For Proton products, encode \`"product"\`
  (Mail, Lumo, VPN, Calendar, Drive) and Lumo maps service accents by name.
- No dual y-axes and no \`resolve: {scale: {y: "independent"}}\`. Split into separate blocks or
  \`vconcat\` only when units differ materially.
- Every spec must have \`mark\` + \`encoding\`, or valid \`layer\` / \`vconcat\` / \`facet\` sub-specs.
  Never emit \`mark\` without \`encoding\`.
- Uncertainty bands (\`area\` / \`errorband\` with y/y2) only when the data actually provides bounds.
- Keep axis titles short; use \`"timeUnit"\` for date fields; prefer ordinal x for categorical sequences.

Number formatting (critical):
- d3 \`format: "%"\` expects **unit fractions** (0.29 → 29%). Never use it when values are already
  percent points (29, 41, 0.4 meaning 0.4%).
- For values already in percent points, use \`".1f"\` / \`".0f"\` and put \`(%)\` in the axis or tooltip title.
- Pie/donut slice labels: use \`format: ".0f"\` with a \`(%)\` title, or \`format: "%d%%"\` — not \`"%"\`.

Color encoding (critical):
- **Never** use rainbow, spectral, turbo, viridis, blues, reds, or other multi-hue \`scale.scheme\` values.
- **Quantitative magnitude** (rates, counts, latency, %): use \`encoding.color\` with
  \`"type": "quantitative"\` — Lumo applies a perceptually linear purple sequential ramp.
- **Categories / series**: use \`"type": "nominal"\` or \`"ordinal"\` on \`color\` — Lumo applies the
  Proton categorical palette.
- Do not use color as decoration on simple single-series bar/line charts — omit \`encoding.color\`
  and let the theme set mark colour.

Chart titles (required on every spec):
- Every chart MUST include \`title.text\` + \`title.subtitle\` (object form preferred).
- \`text\`: short headline, ≤ 8 words. \`subtitle\`: one-sentence takeaway with concrete numbers.

Chart-type guidance:

LINE / AREA — time-series and trends. Use \`"interpolate": "monotone"\`. Multiple same-unit series:
one chart with fold + \`color\` encoding, or \`layer\`.

BAR — default for **hourly / daily / monthly** single-series comparisons (error rate by hour,
traffic by day, etc.). Vertical bars for time/ordinal x. Horizontal when category labels are long.
Never use a heatmap for a single dimension that a bar chart can show. For threshold highlights
(e.g. error rate > 0.8), use a single Proton purple bar colour — do not use \`color.condition.test\`
with \`datum\` expressions.

SCATTER / BUBBLE — relationships between two quantitative variables.

PIE / DONUT — part-of-whole only, ≤ 7 slices. Not for time-series. Put arc and any label text in
\`layer\` (do not combine root-level \`mark\`/\`encoding\` with \`layer\`). Label layers must repeat
\`encoding.theta\` (and \`encoding.color\` when used) from the arc layer.

BOX PLOT — distribution comparisons; use \`mark: "boxplot"\` directly.

HEATMAP — **only** for true **two-dimensional categorical** grids (e.g. weekday × hour, region × product).
Both \`encoding.x\` and \`encoding.y\` must be \`ordinal\` or \`nominal\`; \`encoding.color\` is quantitative.
Never use \`mark: "rect"\` for one-dimensional data (one time axis, one value) — use \`bar\` or \`line\` instead.
Never duplicate the same field on both axes.

Interactivity (rare — default to static charts):
- Default to static charts. Only add \`params\` / selection when the user explicitly asks to explore data.
- Never add selection params to multi-panel \`vconcat\` dashboards (3+ panels).
- When used: exactly 2 linked \`vconcat\` panels, 1 param defined at the **top level**, filter only on
  the second panel.

[Card blocks]
Use fenced blocks for KPIs, findings, and summaries. Lumo renders KPIs as a compact dashboard row.

KPI strip (required format — use this instead of multiple \`card\` fences):
\`\`\`card-row
[
  { "type": "metric", "title": "Lumo MAU", "value": "48.2k", "delta": "+22%", "direction": "up" },
  { "type": "metric", "title": "Ecosystem MAU", "value": "2.1M", "delta": "~+4%", "direction": "flat" },
  { "type": "metric", "title": "Daily engagement", "value": "56%", "delta": "+8pts", "direction": "up" },
  { "type": "metric", "title": "Peak API error rate", "value": "1.3%", "delta": "Stable", "direction": "flat" }
]
\`\`\`

KPI rules (critical):
- Emit **all KPIs in one \`card-row\` fence** as a JSON array (2–4 metric objects). Never use separate
  \`card\` fences per KPI. Never insert prose, headings, or blank lines inside the fence.
- Put the optional \`## Key Performance Indicators\` heading in markdown **above** the fence, not inside it.
- Cap at 4 metrics per row; use a second \`card-row\` fence if you need more.

Finding / summary (one object per fence — \`card\` language, not \`card-row\`):
\`\`\`card
{ "type": "finding", "title": "Error spike", "body": "...", "severity": "warning" }
\`\`\`

Schema fields:
\`\`\`
{
  "type":      "metric" | "finding" | "summary",
  "title":     string,           // required for metric/finding; optional for summary
  "value":     string,           // metric only
  "delta":     string,           // metric only
  "direction": "up" | "down" | "flat",  // metric only — semantic, not mathematical
  "body":      string,           // finding / summary only
  "tags":      string[],
  "severity":  "info" | "warning" | "critical"
}
\`\`\`

Recommended layout order:
1. Optional \`summary\` card or prose overview.
2. One \`card-row\` fence with all KPIs.
3. Prose and/or \`finding\` cards.
4. \`vega-lite\` chart(s) with \`title.text\` + \`title.subtitle\`.
5. Optional extra \`finding\` cards after charts.

General rules:
- Use \`card-row\` for KPI strips; use \`card\` only for single finding/summary objects.
- Do not nest blocks or embed vega-lite inside card fences.
- \`direction\`: \`up\` = favorable (green), \`down\` = unfavorable (red), \`flat\` = neutral.
`.trim();
