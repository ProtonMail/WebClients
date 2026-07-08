import type { VisualizationSpec } from 'vega-embed';

import { normalizeVegaLiteSpec, normalizeInvalidD3Formats, normalizeStoredPercentFormats, normalizeTestBasedColorEncoding } from './normalizeVegaLiteSpec';
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

function parseJsonLenient(raw: string): unknown {
    const candidates = [
        raw,
        normalizeJsonText(raw),
        raw.replace(/,\s*([}\]])/g, '$1'),
        normalizeJsonText(raw).replace(/,\s*([}\]])/g, '$1'),
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
    const normalized = normalizeVegaLiteSpec(spec);
    stripHardcodedChartColors(normalized);
    applyProtonMarkColors(normalized);
    stripStrayCompositionMarkEncoding(normalized);
    applyProtonChartPolish(normalized);
    applyResponsiveChartLayout(normalized);
    normalizeTestBasedColorEncoding(normalized);
    normalizeStoredPercentFormats(normalized);
    normalizeInvalidD3Formats(normalized);
    return normalized as VisualizationSpec;
}
