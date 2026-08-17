import embed, { type Result, type VisualizationSpec } from 'vega-embed';
import { expressionInterpreter } from 'vega-interpreter';

import { getProtonVegaConfig } from '../../LumoMarkdown/vega/protonVegaTheme';
import { sanitizeVegaSpec } from '../../LumoMarkdown/vega/sanitizeVegaSpec';
import { createSecureVegaLoader } from '../../LumoMarkdown/vega/secureVegaLoader';

// The model embeds a chart as a non-executing <script> block inside a <section> — browsers never
// execute a <script> whose `type` isn't a recognized JS MIME type (the same mechanism sites use
// for e.g. `application/ld+json`), so this is inert wherever it lands, including the DOMParser
// pass in buildSandboxedDoc. It also avoids HTML-attribute quote-escaping entirely: the spec's own
// quotes/braces sit safely as text content instead of needing entity-escaping inside an attribute
// value, which matters given models already struggle with nested-quote content elsewhere in this
// tool (see DESIGN.md's duplicate-tool-call finding).
const CHART_PLACEHOLDER_TYPE = 'application/lumo-vega-lite+json';
const CHART_PLACEHOLDER_SELECTOR = `script[type="${CHART_PLACEHOLDER_TYPE}"]`;

// sanitizeVegaSpec always forces `width: 'container'` (via applyResponsiveChartLayout, shared with
// chat charts) so the live DOM element's measured size drives layout. That has nothing to measure
// here — rendering happens off-page in a detached, never-attached container — so charts get a
// fixed pixel size instead, the same fallback vega-lite chat charts themselves use when their
// container briefly reports zero width (see `withFallbackWidth` in vega/VegaLiteChart.tsx).
const SLIDE_CHART_WIDTH = 640;
const SLIDE_CHART_HEIGHT = 360;

export function slideContentHasChartPlaceholder(content: string): boolean {
    return content.includes(CHART_PLACEHOLDER_TYPE);
}

function withFixedSlideSize(spec: VisualizationSpec): VisualizationSpec {
    return {
        ...(spec as Record<string, unknown>),
        width: SLIDE_CHART_WIDTH,
        height: SLIDE_CHART_HEIGHT,
        autosize: { type: 'pad', contains: 'padding' },
    } as VisualizationSpec;
}

// sanitizeVegaSpec is the exact function chat-rendered vega-lite charts already go through
// (components/LumoMarkdown/vega/sanitizeVegaSpec.ts) — same mark-type allowlist, same rejection of
// external data/URLs and dangerous usermeta, same expression neutralization. Reusing it means
// slide charts get identical, already-reviewed security guarantees with no new sanitizer to audit.
async function renderSpecToSvg(rawSpecJson: string): Promise<string> {
    const spec = withFixedSlideSize(sanitizeVegaSpec(rawSpecJson));

    // Never attached to the live document — a detached element is all vega-embed needs since the
    // spec above has a fixed pixel size rather than `'container'`.
    const container = document.createElement('div');

    const result: Result = await embed(container, spec, {
        actions: false,
        ast: true,
        expr: expressionInterpreter,
        loader: createSecureVegaLoader(),
        config: getProtonVegaConfig(),
        renderer: 'svg',
        tooltip: false,
    });

    try {
        await result.view.run();
        result.view.resize();
        return await result.view.toSVG();
    } finally {
        result.view.finalize();
    }
}

/**
 * Replaces every chart placeholder in a slide's raw HTML with its pre-rendered, inert SVG. Runs
 * entirely in the trusted parent app, before the content is ever templated into the sandboxed
 * iframe's srcDoc — the iframe never sees vega-lite, a JSON spec, or a spec-interpreting runtime,
 * only markup, exactly like a chart-less deck.
 *
 * A single malformed/rejected spec doesn't fail the whole deck: it's swapped for a small inert
 * fallback so the rest of the slide (and the rest of the deck) still renders.
 */
export async function renderChartsInSlideContent(content: string): Promise<string> {
    if (!slideContentHasChartPlaceholder(content)) {
        return content;
    }

    const doc = new DOMParser().parseFromString(`<!doctype html><body>${content}`, 'text/html');
    const placeholders = Array.from(doc.body.querySelectorAll(CHART_PLACEHOLDER_SELECTOR));

    await Promise.all(
        placeholders.map(async (node) => {
            const wrapper = doc.createElement('div');
            try {
                wrapper.className = 'lumo-chart';
                wrapper.innerHTML = await renderSpecToSvg(node.textContent ?? '');
            } catch {
                wrapper.className = 'lumo-chart-error';
                wrapper.textContent = 'Chart unavailable';
            }
            node.replaceWith(wrapper);
        })
    );

    return doc.body.innerHTML;
}
