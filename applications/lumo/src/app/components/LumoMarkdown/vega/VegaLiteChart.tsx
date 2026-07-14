import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { VisualizationSpec } from 'vega-embed';
import embed, { type Result } from 'vega-embed';
import { expressionInterpreter } from 'vega-interpreter';

import { LUMO_MARKDOWN_CARD_SHELL_CLASS } from '../lumoMarkdownCardShell';
import { useLumoTheme } from '../../../providers';
import { getRenderedSpecJson } from './chartSpecDisplay';
import { getChartDownloadFilename } from './chartDownloadFilename';
import { createSecureVegaLoader } from './secureVegaLoader';
import { VegaChartDownloadButton } from './VegaChartDownloadButton';
import { VegaChartSourceButton, VegaChartSpecPanel } from './VegaChartSpecInspector';
import { getProtonVegaConfig, isDarkSurface } from './protonVegaTheme';
import { sanitizeVegaSpec } from './sanitizeVegaSpec';
import { VegaChartLoadingOverlay } from './VegaChartLoading';

import './VegaLiteChart.scss';

interface VegaLiteChartProps {
    code: string;
    language: string;
}

const FALLBACK_CHART_WIDTH = 480;


async function waitForLayoutWidth(element: HTMLElement, timeoutMs = 3000): Promise<void> {
    if (element.clientWidth > 0) {
        return;
    }

    await new Promise<void>((resolve) => {
        const deadline = performance.now() + timeoutMs;

        const check = () => {
            if (element.clientWidth > 0 || performance.now() >= deadline) {
                resolve();
                return;
            }

            requestAnimationFrame(check);
        };

        requestAnimationFrame(check);
    });
}

function withFallbackWidth(spec: VisualizationSpec): VisualizationSpec {
    return {
        ...(spec as Record<string, unknown>),
        width: FALLBACK_CHART_WIDTH,
        autosize: { type: 'pad', contains: 'padding' },
    } as VisualizationSpec;
}

function chartHasVisibleMarks(container: HTMLElement): boolean {
    const svg = container.querySelector('svg');
    if (!svg) {
        return false;
    }

    const markSelector =
        'g.mark-group, g[class*="mark-"], path[class*="mark"], rect[class*="mark"], line[class*="mark"], circle[class*="mark"], text[class*="mark"]';
    const marks = svg.querySelectorAll<SVGElement>(markSelector);

    for (const mark of marks) {
        if (mark.tagName === 'text' && mark.textContent?.trim()) {
            return true;
        }

        const box = mark.getBoundingClientRect();
        if (box.width > 0 && box.height > 0) {
            return true;
        }
    }

    return svg.querySelector('rect[class*="mark"], path[class*="mark"], line[class*="mark"], circle[class*="mark"]') !== null;
}

async function mountChart(
    container: HTMLElement,
    spec: VisualizationSpec,
    options: Parameters<typeof embed>[2]
): Promise<Result> {
    const result = await embedChart(container, spec, options);
    await result.view.run();
    result.view.resize();
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
    });
    return result;
}

function specUsesContainerWidth(spec: VisualizationSpec): boolean {
    const record = spec as Record<string, unknown>;
    if (record.width === 'container') {
        return true;
    }

    for (const key of ['vconcat', 'hconcat', 'concat', 'layer'] as const) {
        const children = record[key];
        if (!Array.isArray(children)) {
            continue;
        }

        for (const child of children) {
            if (child && typeof child === 'object' && !Array.isArray(child) && (child as Record<string, unknown>).width === 'container') {
                return true;
            }
        }
    }

    return false;
}

async function embedChart(
    container: HTMLElement,
    spec: VisualizationSpec,
    options: Parameters<typeof embed>[2]
): Promise<Result> {
    try {
        return await embed(container, spec, options);
    } catch (error) {
        if ((spec as Record<string, unknown>).width !== 'container') {
            throw error;
        }

        return embed(container, withFallbackWidth(spec), options);
    }
}

/**
 * Renders an LLM-authored Vega/Vega-Lite spec from a markdown code fence.
 *
 * Security controls:
 * - Spec JSON is parsed and sanitized before render (no external data URLs, no embed overrides).
 * - vega-embed uses AST mode with the sandboxed expression interpreter instead of `eval`.
 * - A custom loader rejects all network/file loads so only inline `data.values` work.
 * - Toolbar actions (export/source menu) are disabled; custom download/source controls are provided instead.
 */
export const VegaLiteChart = ({ code, language }: VegaLiteChartProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const embedResultRef = useRef<Result | null>(null);
    const { isDarkLumoTheme } = useLumoTheme();
    const [renderError, setRenderError] = useState<string | null>(null);
    const [sanitizeError, setSanitizeError] = useState<string | null>(null);
    const [renderedSpecJson, setRenderedSpecJson] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(true);
    const [canDownload, setCanDownload] = useState(false);
    const [specSourceExpanded, setSpecSourceExpanded] = useState(false);
    const downloadFilename = useMemo(() => getChartDownloadFilename(code), [code]);
    const getView = useCallback(() => embedResultRef.current?.view, []);

    useEffect(() => {
        setSpecSourceExpanded(false);
    }, [code]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        let cancelled = false;
        let resizeObserver: ResizeObserver | undefined;

        const renderChart = async () => {
            setIsRendering(true);
            setRenderError(null);
            setSanitizeError(null);
            setRenderedSpecJson(null);
            setCanDownload(false);
            embedResultRef.current?.view.finalize();
            embedResultRef.current = null;
            resizeObserver?.disconnect();
            resizeObserver = undefined;
            container.replaceChildren();

            const sanitized = getRenderedSpecJson(code);
            if (sanitized.error) {
                setSanitizeError(sanitized.error);
            }
            setRenderedSpecJson(sanitized.json);

            if (!sanitized.json) {
                setRenderError(sanitized.error ?? 'Failed to sanitize Vega spec');
                setIsRendering(false);
                setSpecSourceExpanded(true);
                return;
            }

            try {
                const spec = sanitizeVegaSpec(code);
                const chartShell = (container.closest('.vega-lite-chart') as HTMLElement | null) ?? container;
                await waitForLayoutWidth(chartShell);
                const dark = isDarkSurface(chartShell);
                const embedOptions = {
                    actions: false,
                    ast: true,
                    expr: expressionInterpreter,
                    loader: createSecureVegaLoader(),
                    config: getProtonVegaConfig(chartShell),
                    tooltip: dark ? { theme: 'dark' } : true,
                } as Parameters<typeof embed>[2];

                const wantsContainerWidth = specUsesContainerWidth(spec);
                const layoutWidth = chartShell.clientWidth;
                const shouldUseFallback = wantsContainerWidth && layoutWidth === 0;

                let result = await mountChart(
                    container,
                    shouldUseFallback ? withFallbackWidth(spec) : spec,
                    embedOptions
                );

                if (!chartHasVisibleMarks(container) && wantsContainerWidth && !shouldUseFallback) {
                    result.view.finalize();
                    container.replaceChildren();
                    result = await mountChart(container, withFallbackWidth(spec), embedOptions);
                }

                if (cancelled) {
                    result.view.finalize();
                    return;
                }

                embedResultRef.current = result;

                if (!chartHasVisibleMarks(container)) {
                    throw new Error('Chart rendered without visible marks');
                }

                setCanDownload(true);

                if (typeof ResizeObserver !== 'undefined') {
                    resizeObserver = new ResizeObserver(() => {
                        embedResultRef.current?.view.resize();
                    });
                    resizeObserver.observe(chartShell);
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }

                const message = error instanceof Error ? error.message : 'Failed to render chart';
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('[VegaLiteChart] Failed to render chart:', message, error);
                }
                setRenderError(message);
                setSpecSourceExpanded(true);
            } finally {
                if (!cancelled) {
                    setIsRendering(false);
                }
            }
        };

        void renderChart();

        return () => {
            cancelled = true;
            resizeObserver?.disconnect();
            embedResultRef.current?.view.finalize();
            embedResultRef.current = null;
        };
    }, [code, isDarkLumoTheme]);

    const showActions = !isRendering;
    const showFailedState = !!renderError || !!sanitizeError;

    return (
        <div
            className={clsx(
                'vega-lite-chart relative overflow-hidden p-4 my-2 mb-5',
                LUMO_MARKDOWN_CARD_SHELL_CLASS,
                isRendering && 'border-none shadow-none',
                showFailedState && 'vega-lite-chart--failed'
            )}
        >
            {showActions ? (
                <div className="vega-lite-chart__actions lumo-no-copy absolute flex gap-1">
                    {canDownload ? (
                        <VegaChartDownloadButton getView={getView} filename={downloadFilename} />
                    ) : null}
                    <VegaChartSourceButton
                        expanded={specSourceExpanded}
                        onToggle={() => setSpecSourceExpanded((value) => !value)}
                    />
                </div>
            ) : null}
            {!showFailedState ? <div ref={containerRef} className="vega-lite-chart__viewport w-full" /> : null}
            {isRendering ? <VegaChartLoadingOverlay /> : null}
            {showActions && specSourceExpanded ? (
                <VegaChartSpecPanel
                    rawCode={code}
                    renderedSpecJson={renderedSpecJson}
                    renderError={renderError}
                    sanitizeError={sanitizeError}
                />
            ) : null}
        </div>
    );
};
