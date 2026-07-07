function slugifyTitle(title: string): string {
    return title
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]+/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

/** Derive a safe PNG filename from a chart spec title, when available. */
export function getChartDownloadFilename(code: string): string {
    try {
        const withoutTrailingCommas = code.trim().replace(/,\s*([}\]])/g, '$1');
        const parsed = JSON.parse(withoutTrailingCommas) as Record<string, unknown>;
        const title = parsed.title;
        const text =
            typeof title === 'string'
                ? title
                : title && typeof title === 'object' && !Array.isArray(title)
                  ? (title as Record<string, unknown>).text
                  : undefined;

        if (typeof text === 'string') {
            const slug = slugifyTitle(text);
            if (slug) {
                return `${slug}.png`;
            }
        }
    } catch {
        // Fall back below.
    }

    return 'chart.png';
}
