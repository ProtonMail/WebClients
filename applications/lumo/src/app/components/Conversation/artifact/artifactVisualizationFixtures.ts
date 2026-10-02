/**
 * Sample artifact bodies that mirror common model output (chat viz fences inside artifact payloads).
 *
 * ## Automated
 *
 * ```bash
 * yarn workspace proton-lumo test -- artifactVisualizationFormatBoundary.test.ts
 * ```
 *
 * ## Manual (artifact panel — recommended)
 *
 * 1. `yarn workspace proton-lumo start`
 * 2. **Cmd/Ctrl + Shift + P** → Debug View → **Rendering** tab → **Test Renderer**
 * 3. Select one or more:
 *    - `Chat viz (reference): card-row + vega-lite in message body`
 *    - `Artifact panel: document with chat viz fences (cards → table/quote, live chart)`
 *    - `Artifact panel: slides with stray vega-lite fence (cleaned up to a chart)`
 *    - `Artifact panel: slides with chart placeholder (working embed)`
 * 4. **Inject Test Content**, open the conversation, click the artifact chip to open the panel.
 *
 * Tip: inject the chat reference + document fixture in one go to compare message body vs panel side by side.
 */

/** Markdown the model often puts in `type: "document"` when following chat [Visualization] rules. */
export const DOCUMENT_WITH_CHAT_VIZ_BLOCKS = `## Baseline

| Signal | Value | Source |
| --- | --- | --- |
| Accounts | >100M | Internal |
| Revenue | >$100M | Internal |

\`\`\`card-row
[
  { "type": "metric", "title": "Accounts", "value": "100M+", "delta": "Consumer scale", "direction": "up" },
  { "type": "metric", "title": "Revenue", "value": ">$100M", "delta": "Run-rate", "direction": "up" }
]
\`\`\`

\`\`\`card
{ "type": "finding", "title": "The tension", "body": "Scale without enterprise depth.", "severity": "warning" }
\`\`\`

\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "title": { "text": "Sample trend", "subtitle": "Fixture data" },
  "data": { "values": [{ "year": 2024, "value": 10 }, { "year": 2025, "value": 14 }] },
  "mark": "bar",
  "encoding": {
    "x": { "field": "year", "type": "ordinal", "title": "Year" },
    "y": { "field": "value", "type": "quantitative", "title": "Value" }
  }
}
\`\`\`
`;

/** Wrong for presentations: chat-style fence inside slide HTML. Rewritten to a chart placeholder by renderChartsInSlideContent (D12). */
export const PRESENTATION_WITH_VEGA_LITE_FENCE = `<section>
<h2>What the format boundary is</h2>
<p>Everything an assistant emits is text.</p>
<pre><code>\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v6.json",
  "width": "container",
  "title": { "text": "Accounts vs revenue" },
  "data": { "values": [{ "metric": "Accounts", "value": 100 }] },
  "mark": "bar",
  "encoding": {
    "x": { "field": "metric", "type": "nominal" },
    "y": { "field": "value", "type": "quantitative" }
  }
}
\`\`\`</code></pre>
</section>`;

const MINIMAL_BAR_SPEC = JSON.stringify({
    mark: 'bar',
    data: { values: [{ a: 'x', b: 1 }] },
    encoding: { x: { field: 'a', type: 'nominal' }, y: { field: 'b', type: 'quantitative' } },
});

/** Correct for presentations: inert script placeholder (pre-rendered to SVG before iframe load). */
export const PRESENTATION_WITH_CHART_PLACEHOLDER = `<section>
<h2>Chart slide</h2>
<script type="application/lumo-vega-lite+json">${MINIMAL_BAR_SPEC}</script>
</section>`;

export function documentArtifactFixture(content: string = DOCUMENT_WITH_CHAT_VIZ_BLOCKS) {
    return {
        id: 'viz-format-fixture',
        type: 'document' as const,
        title: 'Visualization format fixture',
        content,
    };
}

export function presentationArtifactFixture(content: string) {
    return {
        id: 'slides-viz-fixture',
        type: 'presentation' as const,
        title: 'Slides viz fixture',
        content,
    };
}
