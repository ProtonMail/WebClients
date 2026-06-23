import type { ContentKind } from './normalize';

// Zero-width and bidirectional-control characters that can be interleaved into
// codes to evade matching. Written as \u escapes (rather than literal invisible
// characters) so the source stays lint-clean and readable.
const INVISIBLE_CHARS_RE = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g;
const WHITESPACE_RE = /\s+/g;
const BETWEEN_TAG_WS_RE = /(?<=>)\s+|\s+(?=<)/g;
const HIDDEN_STYLE_RE = /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0|max-height\s*:\s*0/i;

const DROP_TAGS = ['script', 'style', 'meta', 'noscript', 'head'];

export function parse(html: string): Document {
    return new DOMParser().parseFromString(html, 'text/html');
}

export function prune(doc: Document): Document {
    for (const tag of DROP_TAGS) {
        doc.querySelectorAll(tag).forEach((n) => n.remove());
    }
    doc.querySelectorAll('[style]').forEach((n) => {
        const style = n.getAttribute('style') || '';
        if (HIDDEN_STYLE_RE.test(style)) {
            n.remove();
        }
    });
    return doc;
}

export function clean(text: string): string {
    const normalized = text.normalize('NFKC').replace(INVISIBLE_CHARS_RE, '');
    return normalized.replace(WHITESPACE_RE, ' ').trim();
}

// Strip quotes and collapse whitespace sitting against a tag boundary so that
// `>123456<`-style matches survive attribute quoting and pretty-printed markup.
// Used to derive `collapsedHtml` once per body for the tag-content extractors.
export function collapseTagWhitespace(html: string): string {
    return html.replace(/['"]/g, '').replace(BETWEEN_TAG_WS_RE, '');
}

export function textNodes(doc: Document): string[] {
    const body = doc.body;
    if (!body) {
        return [];
    }
    const out: string[] = [];
    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    let n: Node | null;

    while ((n = walker.nextNode())) {
        out.push(clean(n.nodeValue || ''));
    }
    return out;
}

export interface PreparedBody {
    /** Parsed + pruned document for HTML bodies; null for plaintext. */
    doc: Document | null;
    /** Whole-body visible text used by the colon/code-phrase/visible extractors. */
    visibleText: string;
    /** Per-segment text used by the edge/isolated extractors: text nodes for HTML, lines for plaintext. */
    segments: string[];
    /** Quote-stripped, tag-boundary-collapsed HTML used by the tag-content extractors; `''` for plaintext. */
    collapsedHtml: string;
}

/**
 * Parse and derive every shared text artifact a body needs, exactly once, so the
 * extractors can read them off {@link ExtractInput} instead of each re-parsing the
 * same HTML. For HTML, text nodes are joined with a space (rather than using
 * textContent, which concatenates across element boundaries with no separator) so a
 * code split across sibling tags — e.g. <span>021</span><span>667</span> — becomes
 * "021 667" instead of "021667". This mirrors BeautifulSoup's get_text(separator=' ')
 * used by the reference impl.
 */
export function prepareBody(kind: ContentKind, body: string): PreparedBody {
    if (kind === 'html') {
        const doc = prune(parse(body));
        const nodes = textNodes(doc);
        return {
            doc,
            visibleText: clean(nodes.join(' ')),
            segments: nodes,
            collapsedHtml: collapseTagWhitespace(body),
        };
    }
    return { doc: null, visibleText: body, segments: body.split(/\r?\n/), collapsedHtml: '' };
}
