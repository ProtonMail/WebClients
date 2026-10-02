import embed, { type Result, type VisualizationSpec } from 'vega-embed';
import { expressionInterpreter } from 'vega-interpreter';

import { getProtonVegaConfig } from './protonVegaTheme';
import { sanitizeVegaSpec } from './sanitizeVegaSpec';
import { createSecureVegaLoader } from './secureVegaLoader';

// The static counterpart of VegaLiteChart: same sanitizer, loader and theme, but rendered once to an
// inert SVG string for surfaces that can't run vega (sandboxed slides, PDF/print exports).

// sanitizeVegaSpec always forces `width: 'container'` (via applyResponsiveChartLayout, shared with
// chat charts) so the live DOM element's measured size drives layout. That has nothing to measure
// here — rendering happens off-page in a detached, never-attached container — so charts get a
// fixed pixel size instead, the same fallback vega-lite chat charts themselves use when their
// container briefly reports zero width (see `withFallbackWidth` in VegaLiteChart.tsx).
export const STATIC_CHART_WIDTH = 640;
export const STATIC_CHART_HEIGHT = 360;

interface StaticChartSize {
    width: number;
    height: number;
}

function withFixedSize(spec: VisualizationSpec, size: StaticChartSize): VisualizationSpec {
    return {
        ...(spec as Record<string, unknown>),
        width: size.width,
        height: size.height,
        autosize: { type: 'pad', contains: 'padding' },
    } as VisualizationSpec;
}

/**
 * Render a raw Vega-Lite spec (JSON text, as the model wrote it) to an SVG string. Throws when the
 * spec is malformed or rejected by sanitizeVegaSpec — callers swap in their own fallback.
 *
 * sanitizeVegaSpec is the exact function chat-rendered charts go through (mark-type allowlist,
 * rejection of external data/URLs and dangerous usermeta, expression neutralization), so static
 * charts get identical, already-reviewed security guarantees.
 */
export async function renderVegaSpecToSvg(
    rawSpecJson: string,
    size: StaticChartSize = { width: STATIC_CHART_WIDTH, height: STATIC_CHART_HEIGHT }
): Promise<string> {
    const spec = withFixedSize(sanitizeVegaSpec(rawSpecJson), size);

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
