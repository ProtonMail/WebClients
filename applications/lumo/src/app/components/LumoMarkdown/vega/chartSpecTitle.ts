export interface ChartSpecTitle {
    text?: string;
    subtitle?: string;
}

function readTitleText(value: unknown): string | undefined {
    if (typeof value === 'string') {
        return value.trim() || undefined;
    }
    // Vega-Lite allows multi-line titles as an array of lines.
    if (Array.isArray(value) && value.every((line) => typeof line === 'string')) {
        return value.join(' ').trim() || undefined;
    }
    return undefined;
}

/**
 * Read a chart's title and subtitle from raw spec JSON (as the model wrote it). Returns an empty
 * object when the spec doesn't parse or has no title.
 */
export function readChartSpecTitle(code: string): ChartSpecTitle {
    const title = parseChartSpecLenient(code)?.title;

    if (title && typeof title === 'object' && !Array.isArray(title)) {
        const titleObject = title as Record<string, unknown>;
        return { text: readTitleText(titleObject.text), subtitle: readTitleText(titleObject.subtitle) };
    }

    return { text: readTitleText(title) };
}

/** Parse raw spec JSON, tolerating trailing commas; null when it isn't a JSON object. */
export function parseChartSpecLenient(code: string): Record<string, unknown> | null {
    try {
        const withoutTrailingCommas = code.trim().replace(/,\s*([}\]])/g, '$1');
        const parsed: unknown = JSON.parse(withoutTrailingCommas);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null;
    } catch {
        return null;
    }
}
