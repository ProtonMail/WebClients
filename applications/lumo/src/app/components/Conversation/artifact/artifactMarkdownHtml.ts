import { type ComponentPropsWithoutRef, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Markdown, { type ExtraProps } from 'react-markdown';

import remarkGfm from 'remark-gfm';

import { readChartSpecTitle } from '../../LumoMarkdown/vega/chartSpecTitle';
import { chartPlaceholderHtml, readArtifactChartFence } from './artifactCharts';
import { normalizeDocumentCardFences } from './artifactVizCards';

/**
 * How a ```vega-lite fence comes out of the HTML (D12):
 * - `placeholder`: the inert chart placeholder, for HTML exports to pre-render to SVG
 *   (`renderChartPlaceholders`) before sanitizing.
 * - `summary`: a "Chart: title — subtitle" line, for text-only outputs.
 */
export type MarkdownChartOutput = 'placeholder' | 'summary';

interface MarkdownToHtmlOptions {
    charts: MarkdownChartOutput;
}

function chartSummaryText(code: string): string {
    const { text, subtitle } = readChartSpecTitle(code);
    const label = text ? `Chart: ${text}` : 'Chart';
    return subtitle ? `${label} — ${subtitle}` : label;
}

/** The `pre` override export HTML uses; exported for tests (react-markdown can't load under Jest). */
export function createExportPreComponent(charts: MarkdownChartOutput) {
    return function ExportPre({ node, children, ...rest }: ComponentPropsWithoutRef<'pre'> & ExtraProps) {
        const fence = readArtifactChartFence(node);
        if (!fence) {
            return createElement('pre', rest, children);
        }
        if (charts === 'placeholder') {
            return createElement('div', { dangerouslySetInnerHTML: { __html: chartPlaceholderHtml(fence.code) } });
        }
        return createElement('p', null, chartSummaryText(fence.code));
    };
}

/**
 * Convert artifact markdown to an HTML fragment. Same strict viz handling as the panel preview:
 * leaked chat card fences become a table / quote, and only explicit ```vega-lite fences count as charts.
 */
export function markdownToHtmlBody(markdown: string, { charts }: MarkdownToHtmlOptions): string {
    return renderToStaticMarkup(
        createElement(Markdown, {
            remarkPlugins: [remarkGfm],
            components: { pre: createExportPreComponent(charts) },
            children: normalizeDocumentCardFences(markdown),
        })
    );
}
