// ─────────────────────────────────────────────────────────────────────────────
// LUMO VISUALIZATION + CARD INSTRUCTIONS
// Injected into the system prompt. Controls fenced-block primitives:
//   1. ```vega-lite   — charts rendered by Lumo's Vega-Lite pipeline
//   2. ```card-row   — KPI strip (JSON array of metric objects)
//   3. ```card        — finding/summary cards (single object per fence)
// Lumo's render pipeline normalizes many common LLM mistakes (year axes, layer
// shape, percent formats, theme colors). Focus on correct chart choice and JSON shape.
// ─────────────────────────────────────────────────────────────────────────────

export const VISUALIZATION_INSTRUCTIONS = `
[Visualization]
When numeric data is clearer as a chart than prose or a large table, emit a fenced \`vega-lite\` block with valid Vega-Lite v6 JSON ($schema "https://vega.github.io/schema/vega-lite/v6.json").

Prefer \`vega-lite\` over \`generate_image\` for structured numeric data (trends, comparisons, distributions, shares). Use \`generate_image\` only for conceptual illustrations, metaphors, UI mockups, or visuals with no data table.

Vega-Lite rules:
- Strict JSON: double-quoted keys/strings, no trailing commas, comments, or JavaScript expressions (\`labelExpr\`, \`datum\` in \`color.condition\`, etc.).
- Inline data only (\`data.values\`); no external URLs or file paths.
- \`"width": "container"\`. Do not set \`height\`, \`autosize\`, or theme \`config\`.
- Lumo applies the Proton Vega theme — never set hex colors, \`scale.scheme\`, \`scale.range\`, or \`config.range\`. Use \`encoding.color\` with \`field\`; encode \`"product"\` for Proton services (Mail, Lumo, VPN, Calendar, Drive).
- Every spec needs \`mark\` + \`encoding\`, or valid \`layer\` / \`vconcat\` / \`facet\` sub-specs. Never combine root \`mark\`/\`encoding\` with a \`layer\` array; never emit empty \`{}\` layer entries.
- No dual y-axes or \`resolve: {scale: {y: "independent"}}\` — split into separate blocks or \`vconcat\` when units differ.
- Every chart needs \`title.text\` (≤ 8 words) and \`title.subtitle\` (one-sentence takeaway with numbers).
- Integer calendar years → \`encoding.x.type: "ordinal"\` (not \`temporal\`). ISO dates/timestamps → \`temporal\`.
- Values already in percent points → \`".0f"\` / \`".1f"\` with \`(%)\` in axis title; \`format: "%"\` only for unit fractions (0.29 → 29%).
- Default to static charts; add \`params\`/selection only when the user asks to explore data.

Chart choice:
- **bar** — hourly/daily/monthly comparisons; horizontal when labels are long.
- **line/area** — time-series; \`"interpolate": "monotone"\`; multi-series via \`color\` or \`layer\` (all marks in \`layer\`, no root mark).
- **scatter** — two quantitative variables.
- **arc** — part-of-whole, ≤ 7 slices; legend + tooltips only (no text label layers).
- **rect heatmap** — two categorical dimensions only; never for one-dimensional data.
- **boxplot** — distribution comparisons.

Example:
\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "title": { "text": "API Error Rate by Hour", "subtitle": "Peak 1.3% at 03:00 UTC" },
  "data": { "values": [{ "hour": 0, "error_rate": 0.4 }, { "hour": 3, "error_rate": 1.3 }] },
  "mark": { "type": "bar" },
  "encoding": {
    "x": { "field": "hour", "type": "ordinal", "title": "Hour (UTC)" },
    "y": { "field": "error_rate", "type": "quantitative", "title": "Error rate (%)" }
  }
}
\`\`\`

Never emit: \`mark: "image"\`/\`"geoshape"\`, \`encoding.url\`, hard-coded colors, rainbow/spectral schemes, donut text layers, or Excel-style formats (\`:0\`).

[Card blocks]
KPI strip — all metrics in one \`card-row\` fence (2–4 objects), never separate \`card\` fences per KPI:
\`\`\`card-row
[
  { "type": "metric", "title": "Lumo MAU", "value": "48.2k", "delta": "+22%", "direction": "up" },
  { "type": "metric", "title": "Peak API error rate", "value": "1.3%", "delta": "Stable", "direction": "flat" }
]
\`\`\`

Finding/summary — one object per \`card\` fence:
\`\`\`card
{ "type": "finding", "title": "Error spike", "body": "...", "severity": "warning" }
\`\`\`

Fields: \`type\` (metric|finding|summary), \`title\`, \`value\`/\`delta\`/\`direction\` (metric; direction = semantic up/down/flat), \`body\` (finding/summary), optional \`tags\`, \`severity\` (info|warning|critical).

Layout: optional summary → one \`card-row\` → prose/findings → \`vega-lite\` chart(s) → optional post-chart findings. Do not nest blocks or embed vega-lite inside cards.

[Where these blocks go]
- \`card-row\` and \`card\` are for chat replies only. Never put them inside \`create_artifact\` content; write key figures there as prose or a markdown table instead.
- Charts may go in a chat reply or inside a document or presentation artifact (the \`create_artifact\` description says how to embed them). A chart that answers a question goes in the chat reply; a chart that belongs to an artifact goes only in the artifact, not repeated in the reply.
`.trim();

/**
 * Chart rules for artifact content. Kept here, next to the full chat rules, so both stay on the
 * same Vega-Lite version. Short on purpose: the tool description is sent even when
 * VISUALIZATION_INSTRUCTIONS is not (it is behind a feature flag and a user setting).
 */
export const ARTIFACT_CHART_RULES =
    'Charts use Vega-Lite v6 JSON ("$schema": "https://vega.github.io/schema/vega-lite/v6.json") ' +
    'with inline `data.values` (never `url`), a `title` with `text` and a one-sentence `subtitle`, ' +
    'and no colors, `height`, `autosize` or `config` (the app applies its own theme and size).';
