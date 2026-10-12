import type { Element } from 'hast';

import { parseChartSpecLenient, readChartSpecTitle } from '../../LumoMarkdown/vega/chartSpecTitle';
import { getCodeBlockLanguage } from '../../LumoMarkdown/vega/codeBlockUtils';
import { isVegaLanguage } from '../../LumoMarkdown/vega/vegaLanguages';

// Dependency-light chart helpers shared by the panel, the slide pass and the exports (D12). Rendering
// lives elsewhere (VegaLiteChart, renderVegaSpecToSvg) so importing this never pulls in vega.

// The model embeds a chart as a non-executing <script> block inside a <section> — browsers never
// execute a <script> whose `type` isn't a recognized JS MIME type (the same mechanism sites use
// for e.g. `application/ld+json`), so this is inert wherever it lands, including the DOMParser
// pass in buildArtifactDocument. It also avoids HTML-attribute quote-escaping entirely: the spec's own
// quotes/braces sit safely as text content instead of needing entity-escaping inside an attribute
// value, which matters given models already struggle with nested-quote content elsewhere in this
// tool (see DESIGN.md's duplicate-tool-call finding).
export const CHART_PLACEHOLDER_TYPE = 'application/lumo-vega-lite+json';
export const CHART_PLACEHOLDER_SELECTOR = `script[type="${CHART_PLACEHOLDER_TYPE}"]`;

/**
 * The placeholder as an HTML string, for producers that build markup as text (the document export's
 * markdown → HTML step). Every `<` is JSON-escaped so the spec can't close the <script> early; that is
 * only valid inside JSON strings, which is the only place `<` can appear in a valid spec.
 */
export function chartPlaceholderHtml(specJson: string): string {
    return `<script type="${CHART_PLACEHOLDER_TYPE}">${specJson.trim().replace(/</g, '\\u003c')}</script>`;
}

/**
 * Strict on purpose: only an explicitly labelled ```vega / ```vega-lite fence is a chart in a
 * document. Chat also sniffs ```json and unlabelled blocks for spec-like JSON, but a document may
 * quote a spec as an example, and that must stay code. Takes the hast `pre` node react-markdown passes.
 */
export function readArtifactChartFence(node: Element | undefined): { language: string; code: string } | null {
    const code = node?.children[0];
    if (!code || code.type !== 'element' || code.tagName !== 'code') {
        return null;
    }

    const language = getCodeBlockLanguage(undefined, code as { properties?: { className?: string[] } });
    if (!isVegaLanguage(language)) {
        return null;
    }

    const text = code.children
        .map((child) => {
            return child.type === 'text' ? child.value : '';
        })
        .join('')
        .replace(/\n$/, '');

    return { language, code: text };
}

// Text fallback for a chart that couldn't be rendered to an image (Word export): its title, subtitle and
// data table. The cap keeps a dense series (hundreds of points) from turning into pages of table; the rows past
// it are counted rather than dropped silently.
export const CHART_TABLE_MAX_ROWS = 50;

type DataRow = Record<string, unknown>;

function isPlainRow(value: unknown): value is DataRow {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readInlineRows(spec: Record<string, unknown>): DataRow[] | null {
    const data = spec.data;
    const values = isPlainRow(data) ? data.values : undefined;
    return Array.isArray(values) && values.length > 0 && values.every(isPlainRow) ? values : null;
}

/** Axis titles from the spec's encoding, so headers read "Annual Price (USD)" rather than "price". */
function readFieldTitles(spec: Record<string, unknown>): Map<string, string> {
    const titles = new Map<string, string>();
    const encoding = spec.encoding;
    if (!isPlainRow(encoding)) {
        return titles;
    }
    Object.values(encoding).forEach((channel) => {
        if (isPlainRow(channel) && typeof channel.field === 'string' && typeof channel.title === 'string') {
            titles.set(channel.field, channel.title);
        }
    });
    return titles;
}

function toCell(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return text.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
}

function escapeInline(text: string): string {
    return text.replace(/([\\`*_[\]])/g, '\\$1');
}

/**
 * A chart as plain markdown: bold "Chart: title", the subtitle in italics, then a table of its inline
 * `data.values` (columns in first-seen key order, headed by the encoding's axis titles). Specs whose
 * data isn't a flat inline table (layers, external data) keep only the title lines.
 */
export function chartSpecToMarkdown(code: string): string {
    const { text, subtitle } = readChartSpecTitle(code);
    const parts = [`**${escapeInline(text ? `Chart: ${text}` : 'Chart')}**`];
    if (subtitle) {
        parts.push(`*${escapeInline(subtitle)}*`);
    }

    const spec = parseChartSpecLenient(code);
    const rows = spec ? readInlineRows(spec) : null;
    if (spec && rows) {
        const columns = Array.from(
            new Set(
                rows.flatMap((row) => {
                    return Object.keys(row);
                })
            )
        );
        const titles = readFieldTitles(spec);
        const shown = rows.slice(0, CHART_TABLE_MAX_ROWS);
        const header = columns.map((column) => {
            return toCell(titles.get(column) ?? column);
        });
        const lines = [
            `| ${header.join(' | ')} |`,
            `| ${columns
                .map(() => {
                    return '---';
                })
                .join(' | ')} |`,
            ...shown.map((row) => {
                const cells = columns.map((column) => {
                    return toCell(row[column]);
                });
                return `| ${cells.join(' | ')} |`;
            }),
        ];
        parts.push(lines.join('\n'));
        if (rows.length > shown.length) {
            parts.push(`*…and ${rows.length - shown.length} more rows.*`);
        }
    }

    return parts.join('\n\n');
}
