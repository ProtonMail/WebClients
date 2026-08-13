import type { VisualizationSpec } from 'vega-embed';

import { normalizeVegaLiteSpec, normalizeArcDonutCharts, normalizeInvalidD3Formats, normalizeStoredPercentFormats, normalizeTestBasedColorEncoding, normalizeUnsafeVegaExpressions } from './normalizeVegaLiteSpec';
import { applyProtonChartPolish, applyProtonMarkColors, applyResponsiveChartLayout, stripHardcodedChartColors, stripStrayCompositionMarkEncoding } from './protonVegaTheme';

export class VegaSpecSecurityError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VegaSpecSecurityError';
    }
}

export class VegaSpecParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'VegaSpecParseError';
    }
}

const DANGEROUS_USERMETA_KEYS = ['embedOptions', 'vegaEmbed'] as const;

/** Mark types that can trigger outbound network requests (image loads, geo tiles, etc.). */
const BLOCKED_MARK_TYPES = new Set(['image', 'geoshape']);

/**
 * Mark types Lumo charts are expected to emit. Anything else is rejected so new
 * upstream mark types cannot silently open exfil channels before we review them.
 */
const ALLOWED_MARK_TYPES = new Set([
    'arc',
    'area',
    'bar',
    'boxplot',
    'circle',
    'errorband',
    'errorbar',
    'line',
    'point',
    'rect',
    'rule',
    'square',
    'text',
    'tick',
    'trail',
]);

const NESTED_VEGA_LITE_SPEC_KEYS = ['layer', 'vconcat', 'hconcat', 'concat'] as const;

function extractMarkType(mark: unknown): string | null {
    if (typeof mark === 'string') {
        return mark;
    }

    if (!mark || typeof mark !== 'object' || Array.isArray(mark)) {
        return null;
    }

    const type = (mark as Record<string, unknown>).type;
    return typeof type === 'string' ? type : null;
}

function assertAllowedMarkTypesInSpec(spec: Record<string, unknown>, path: string[]): void {
    const markType = extractMarkType(spec.mark);
    if (markType) {
        if (BLOCKED_MARK_TYPES.has(markType) || !ALLOWED_MARK_TYPES.has(markType)) {
            throw new VegaSpecSecurityError(`Mark type "${markType}" is not allowed`);
        }
    }

    const encoding = spec.encoding;
    if (encoding && typeof encoding === 'object' && !Array.isArray(encoding) && 'url' in encoding) {
        throw new VegaSpecSecurityError('encoding.url is not allowed');
    }

    for (const key of NESTED_VEGA_LITE_SPEC_KEYS) {
        const nestedSpecs = spec[key];
        if (!Array.isArray(nestedSpecs)) {
            continue;
        }

        nestedSpecs.forEach((nestedSpec, index) => {
            if (nestedSpec && typeof nestedSpec === 'object' && !Array.isArray(nestedSpec)) {
                assertAllowedMarkTypesInSpec(nestedSpec as Record<string, unknown>, [...path, key, String(index)]);
            }
        });
    }

    const nestedSpec = spec.spec;
    if (nestedSpec && typeof nestedSpec === 'object' && !Array.isArray(nestedSpec)) {
        assertAllowedMarkTypesInSpec(nestedSpec as Record<string, unknown>, [...path, 'spec']);
    }
}

function stripDangerousUsermeta(spec: Record<string, unknown>): void {
    const usermeta = spec.usermeta;
    if (!usermeta || typeof usermeta !== 'object' || Array.isArray(usermeta)) {
        return;
    }

    const meta = usermeta as Record<string, unknown>;
    for (const key of DANGEROUS_USERMETA_KEYS) {
        delete meta[key];
    }
}

function isExternalDataSource(value: unknown): value is Record<string, unknown> {
    return (
        !!value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof (value as Record<string, unknown>).url === 'string' &&
        !('values' in (value as Record<string, unknown>))
    );
}

function assertNoExternalDataSources(value: unknown, path: string[]): void {
    if (value === null || typeof value !== 'object') {
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((item, index) => assertNoExternalDataSources(item, [...path, String(index)]));
        return;
    }

    const objectValue = value as Record<string, unknown>;

    if (path[path.length - 1] === 'data' && isExternalDataSource(objectValue)) {
        throw new VegaSpecSecurityError('External data URLs are not allowed');
    }

    if (typeof objectValue.config === 'string') {
        throw new VegaSpecSecurityError('Config must be an inline object, not a URL');
    }

    for (const [key, nestedValue] of Object.entries(objectValue)) {
        assertNoExternalDataSources(nestedValue, [...path, key]);
    }
}

function stripMarkdownCodeFence(raw: string): string {
    const trimmed = raw.trim();
    const fenceMatch = trimmed.match(/^```(?:[\w-]+)?[ \t]*\n([\s\S]*?)\n```$/);
    return fenceMatch ? fenceMatch[1]!.trim() : trimmed;
}

function normalizeJsonText(raw: string): string {
    return raw
        .replace(/^\uFEFF/, '')
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
}

/** Quote bare object keys that LLMs often emit as JavaScript literals (e.g. `format: ".1f"`). */
function quoteUnquotedJsonKeys(raw: string): string {
    return raw.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":');
}

/**
 * LLMs sometimes double-wrap array objects: `[{ { "k": v } }]` instead of `[{ "k": v }]`.
 * Only matches when `{` immediately follows `[{`, which is invalid JSON and safe to collapse.
 */
function fixDoubleWrappedArrayObjects(raw: string): string {
    return raw.replace(/\[\{\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\s*\}\s*\]/g, '[{$1}]');
}

function withoutTrailingCommas(text: string): string {
    return text.replace(/,\s*([}\]])/g, '$1');
}

function repairLlmJson(raw: string): string {
    return withoutTrailingCommas(quoteUnquotedJsonKeys(fixDoubleWrappedArrayObjects(normalizeJsonText(raw))));
}

function parseJsonLenient(raw: string): unknown {
    const candidates = [
        repairLlmJson(raw),
        raw,
        normalizeJsonText(raw),
        withoutTrailingCommas(raw),
        withoutTrailingCommas(normalizeJsonText(raw)),
        quoteUnquotedJsonKeys(raw),
        quoteUnquotedJsonKeys(normalizeJsonText(raw)),
        withoutTrailingCommas(quoteUnquotedJsonKeys(raw)),
        withoutTrailingCommas(quoteUnquotedJsonKeys(normalizeJsonText(raw))),
        fixDoubleWrappedArrayObjects(raw),
        fixDoubleWrappedArrayObjects(normalizeJsonText(raw)),
    ];

    let lastError: Error | undefined;
    for (const candidate of candidates) {
        try {
            return JSON.parse(candidate);
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
        }
    }

    throw lastError ?? new Error('Invalid JSON');
}

export function parseVegaSpecJson(raw: string): Record<string, unknown> {
    const trimmed = stripMarkdownCodeFence(raw.trim());
    if (!trimmed) {
        throw new VegaSpecParseError('Vega spec is empty');
    }

    try {
        const parsed: unknown = parseJsonLenient(trimmed);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new VegaSpecParseError('Vega spec must be a JSON object');
        }
        return parsed as Record<string, unknown>;
    } catch (error) {
        if (error instanceof VegaSpecParseError) {
            throw error;
        }

        const detail = error instanceof Error ? error.message : String(error);
        throw new VegaSpecParseError(`Vega spec is not valid JSON (${detail})`);
    }
}

export function sanitizeVegaSpec(raw: string): VisualizationSpec {
    const spec = parseVegaSpecJson(raw);
    stripDangerousUsermeta(spec);
    assertNoExternalDataSources(spec, []);
    assertAllowedMarkTypesInSpec(spec, []);
    const normalized = normalizeVegaLiteSpec(spec);
    stripHardcodedChartColors(normalized);
    applyProtonMarkColors(normalized);
    stripStrayCompositionMarkEncoding(normalized);
    applyProtonChartPolish(normalized);
    applyResponsiveChartLayout(normalized);
    normalizeArcDonutCharts(normalized);
    normalizeTestBasedColorEncoding(normalized);
    normalizeStoredPercentFormats(normalized);
    normalizeInvalidD3Formats(normalized);
    normalizeUnsafeVegaExpressions(normalized);
    return normalized as VisualizationSpec;
}
