import embed, { type Result, type VisualizationSpec } from 'vega-embed';
import { expressionInterpreter } from 'vega-interpreter';

import { getProtonVegaConfig } from './protonVegaTheme';
import { sanitizeVegaSpec } from './sanitizeVegaSpec';
import { createSecureVegaLoader } from './secureVegaLoader';

// The static counterpart of VegaLiteChart: same sanitizer, loader and theme, but rendered once to an
// inert SVG string (sandboxed slides, PDF/print exports) or PNG bytes (Word) for surfaces that can't
// run vega.

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

async function withStaticView<T>(
    rawSpecJson: string,
    size: StaticChartSize,
    read: (view: Result['view']) => Promise<T>
): Promise<T> {
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
        return await read(result.view);
    } finally {
        result.view.finalize();
    }
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
    return withStaticView(rawSpecJson, size, (view) => {
        return view.toSVG();
    });
}

export interface StaticChartPng {
    data: Uint8Array<ArrayBuffer>;
    /** Size in CSS pixels (the PNG itself is `scale` times larger). */
    width: number;
    height: number;
}

function readPngSize(data: Uint8Array<ArrayBuffer>): { width: number; height: number } {
    // The IHDR chunk always comes first: width and height are big-endian at bytes 16 and 20.
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return { width: view.getUint32(16), height: view.getUint32(20) };
}

/**
 * Render a raw Vega-Lite spec to PNG bytes, for outputs that can't take SVG (Word: the docx version
 * in use only embeds raster images). Same sanitizer, loader and theme as renderVegaSpecToSvg; the
 * same call the chat chart's PNG download makes. Throws on a bad spec, like renderVegaSpecToSvg.
 */
export async function renderVegaSpecToPng(
    rawSpecJson: string,
    { scale = 2, ...size }: Partial<StaticChartSize> & { scale?: number } = {}
): Promise<StaticChartPng> {
    const dataUrl = await withStaticView(
        rawSpecJson,
        { width: size.width ?? STATIC_CHART_WIDTH, height: size.height ?? STATIC_CHART_HEIGHT },
        (view) => {
            return view.toImageURL('png', scale);
        }
    );

    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const data = Uint8Array.from(atob(base64), (char) => {
        return char.charCodeAt(0);
    });
    // Measured from the PNG rather than the spec: titles, axes and legends add to the plot size.
    const pixels = readPngSize(data);

    return { data, width: Math.round(pixels.width / scale), height: Math.round(pixels.height / scale) };
}
