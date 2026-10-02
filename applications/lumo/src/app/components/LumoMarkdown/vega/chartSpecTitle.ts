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
 * Read a chart's title and subtitle from raw spec JSON (as the model wrote it), tolerating trailing
 * commas. Returns an empty object when the spec doesn't parse or has no title.
 */
export function readChartSpecTitle(code: string): ChartSpecTitle {
    try {
        const withoutTrailingCommas = code.trim().replace(/,\s*([}\]])/g, '$1');
        const parsed = JSON.parse(withoutTrailingCommas) as Record<string, unknown>;
        const title = parsed?.title;

        if (title && typeof title === 'object' && !Array.isArray(title)) {
            const titleObject = title as Record<string, unknown>;
            return { text: readTitleText(titleObject.text), subtitle: readTitleText(titleObject.subtitle) };
        }

        return { text: readTitleText(title) };
    } catch {
        return {};
    }
}
