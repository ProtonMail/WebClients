/**
 * Fixed-size pages of a document's text, the unit `read_knowledge` returns. Independent of
 * the search index's chunking (which only splits documents over 20K tokens, into 6K-token
 * chunks) so every read stays small, and deterministic so file cards and reads agree on
 * page numbers.
 */
export const PAGE_CHARS = 12_000;
/** Look back this far from the page limit for a paragraph or line break to cut at. */
const BREAK_SEARCH_CHARS = 2_000;

function findBreak(text: string, start: number, limit: number): number {
    const tail = text.slice(Math.max(start, limit - BREAK_SEARCH_CHARS), limit);
    const offset = limit - tail.length;
    for (const separator of ['\n\n', '\n', '. ', ' ']) {
        const index = tail.lastIndexOf(separator);
        if (index > 0) {
            return offset + index + separator.length;
        }
    }
    return limit;
}

export function splitIntoPages(text: string): string[] {
    const pages: string[] = [];
    let start = 0;
    while (start < text.length) {
        const limit = start + PAGE_CHARS;
        const end = limit >= text.length ? text.length : findBreak(text, start, limit);
        const page = text.slice(start, end).trim();
        if (page) {
            pages.push(page);
        }
        start = end;
    }
    return pages.length > 0 ? pages : [''];
}

/** Short, single-line excerpt around the first query term found, for search results. */
export function snippetAround(text: string, terms: string[], radius = 160): string {
    const lower = text.toLowerCase();
    let index = -1;
    for (const term of terms) {
        const found = lower.indexOf(term);
        if (found !== -1 && (index === -1 || found < index)) {
            index = found;
        }
    }
    const center = index === -1 ? 0 : index;
    const start = Math.max(0, center - radius);
    const end = Math.min(text.length, center + radius);
    const snippet = text.slice(start, end).replace(/\s+/g, ' ').trim();
    return `${start > 0 ? '…' : ''}${snippet}${end < text.length ? '…' : ''}`;
}
