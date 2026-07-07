import { parseMarkdownCodeFence } from '../vega/parseMarkdownCodeFence';
import { tryParseCardSpec } from './parseCardSpec';
import type { MetricCardFence } from './metricCardTypes';

function parseJsonLenient(raw: string): unknown {
    try {
        return JSON.parse(raw);
    } catch {
        try {
            const withoutTrailingCommas = raw.replace(/,\s*([}\]])/g, '$1');
            return JSON.parse(withoutTrailingCommas);
        } catch {
            return null;
        }
    }
}

function parseCardRowPayload(raw: string): unknown {
    const trimmed = raw.trim();
    if (!trimmed) {
        return null;
    }

    return parseJsonLenient(trimmed);
}

/** Card-row entries often omit `"type": "metric"` even when title/value are present. */
function tryParseCardRowMetricEntry(entry: unknown): ReturnType<typeof tryParseCardSpec> {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
    }

    const objectValue = entry as Record<string, unknown>;
    const hasMetricShape =
        typeof objectValue.title === 'string' &&
        objectValue.title.trim() &&
        objectValue.value !== undefined &&
        objectValue.value !== null;

    if (!objectValue.type && hasMetricShape) {
        return tryParseCardSpec(JSON.stringify({ ...objectValue, type: 'metric' }));
    }

    return tryParseCardSpec(JSON.stringify(entry));
}

function metricFencesFromSpecs(specs: ReturnType<typeof tryParseCardSpec>[], language: string): MetricCardFence[] | null {
    const metrics = specs.filter((spec): spec is NonNullable<typeof spec> => !!spec && spec.type === 'metric');
    if (metrics.length === 0 || metrics.length !== specs.length) {
        return null;
    }

    return metrics.map((spec) => ({
        language,
        code: JSON.stringify(spec),
    }));
}

function metricFencesFromCardRowEntries(entries: unknown[], language: string): MetricCardFence[] | null {
    return metricFencesFromSpecs(entries.map((entry) => tryParseCardRowMetricEntry(entry)), language);
}

/** Parse a ```card-row fence — primary KPI strip format (JSON array of metric objects). */
export function parseCardRowFence(content: string): MetricCardFence[] | null {
    const fence = parseMarkdownCodeFence(content.trim());
    if (!fence || fence.language.toLowerCase() !== 'card-row') {
        return null;
    }

    const payload = parseCardRowPayload(fence.code);
    if (Array.isArray(payload)) {
        return metricFencesFromCardRowEntries(payload, 'card');
    }

    if (payload && typeof payload === 'object' && !Array.isArray(payload) && Array.isArray((payload as Record<string, unknown>).cards)) {
        const cards = (payload as Record<string, unknown>).cards as unknown[];
        return metricFencesFromCardRowEntries(cards, 'card');
    }

    return null;
}

export function parseCardRowFromCodeSegment(code: string): MetricCardFence[] | null {
    const payload = parseCardRowPayload(code);
    if (!Array.isArray(payload)) {
        return null;
    }

    return metricFencesFromCardRowEntries(payload, 'card');
}

function parseInternalCardRowBatch(code: string): MetricCardFence[] | null {
    try {
        const parsed = JSON.parse(code) as unknown[];
        if (
            Array.isArray(parsed) &&
            parsed.length > 0 &&
            parsed.every(
                (item) =>
                    !!item &&
                    typeof item === 'object' &&
                    !Array.isArray(item) &&
                    typeof (item as Record<string, unknown>).code === 'string'
            )
        ) {
            return (parsed as Array<{ code: string; language?: string }>).map((item) => ({
                language: item.language || 'card',
                code: item.code,
            }));
        }
    } catch {
        return null;
    }

    return null;
}

/** Parse LLM card-row JSON or grouped card-row batch segments into metric fences. */
export function parseCardRowSegmentCode(code: string): MetricCardFence[] | null {
    return parseCardRowFromCodeSegment(code) ?? parseInternalCardRowBatch(code);
}
