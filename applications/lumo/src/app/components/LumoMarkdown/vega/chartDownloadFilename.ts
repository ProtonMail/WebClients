import { readChartSpecTitle } from './chartSpecTitle';

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
    const { text } = readChartSpecTitle(code);
    const slug = text ? slugifyTitle(text) : '';

    return slug ? `${slug}.png` : 'chart.png';
}
