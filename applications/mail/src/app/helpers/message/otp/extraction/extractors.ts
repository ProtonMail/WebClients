// Concrete extractors.
//
// Each extractor has a `name` (the result column it writes), an `isTitle` flag,
// a `supportedKinds` set of body kinds it handles, and an `extract(input)` that
// short-circuits body extractors whose kind doesn't match `supportedKinds`.
// Extractor-scoped regexes live here; shared regexes/helpers live in ./utils.
import type { ExtractorName } from '../config';
import type { ContentKind } from '../normalize';
import { clean } from '../preprocessing';
import { BOTH_KINDS, HTML_ONLY, PLAIN_ONLY } from './settings';
import {
    attributeMatches,
    dedup,
    isWordlike,
    isolatedMatch,
    joinedSiblingMatches,
    matchAll,
    oneSeparatorOnly,
} from './utils';

export interface ExtractInput {
    subject: string;
    body: string;
    kind: ContentKind;
    /** Parsed + pruned document for HTML bodies; null for plaintext. Shared across extractors. */
    doc: Document | null;
    /** Whole-body visible text, derived once. */
    visibleText: string;
    /** Per-segment text: text nodes for HTML, lines for plaintext. */
    segments: string[];
    /** Quote-stripped, tag-boundary-collapsed HTML for the tag-content extractors; `''` for plaintext. */
    collapsedHtml: string;
}

export interface Extractor {
    name: ExtractorName;
    isTitle: boolean;
    supportedKinds: ReadonlySet<ContentKind>;
    extract(input: ExtractInput): string[];
}

function defineExtractor(opts: {
    name: ExtractorName;
    isTitle?: boolean;
    supportedKinds?: ReadonlySet<ContentKind>;
    run: (input: ExtractInput) => string[];
}): Extractor {
    const isTitle = opts.isTitle ?? false;
    const supportedKinds = opts.supportedKinds ?? BOTH_KINDS;
    return {
        name: opts.name,
        isTitle,
        supportedKinds,
        extract(input) {
            if (!isTitle && !supportedKinds.has(input.kind)) {
                return [];
            }
            return opts.run(input);
        },
    };
}

// ---- Regexes (one extractor each) ----

const TITLE_ENDS_RE = /^[0-9]{4,10}$/;
const TITLE_MID_RE = /\b[0-9]{6,10}\b/g;
const TITLE_SPLIT_RE = /\b[0-9]+(?:[ -][0-9]+)+\b/g;
const HYPHENATED_ALPHA_RE = /\b[A-Z]{3}-[A-Z]{3}\b/g;
const HYPHENATED_ALPHA_FULL_RE = /^[A-Z]{3}-[A-Z]{3}$/;
const TITLE_ENDS_HYPHENATED_RE = /^[A-Z0-9]{3}-[A-Z0-9]{3}$/;

const BODY_TAGS_NUM_RE = /(?<=>)[0-9]{6,10}(?=<)/g;
const BODY_TAGS_GENERAL_RE = /(?<=>)[A-Za-z0-9]{6,10}(?=<)/g;

const OTP_LONG_RE = /(?<!\S)[0-9]{6,10}(?!\S)/g;
const OTP_SHORT_RE = /(?<!\S)[0-9]{4}(?!\S)/g;
const TOKEN_DASH_SPLIT_RE = /(?<!\S)[A-Za-z0-9]+-[A-Za-z0-9]+(?!\S)/g;
const SPACE_SPLIT_DIGITS_RE = /(?<!\S)[0-9]+(?:\s[0-9]+)+(?!\S)/g;

const EDGE_LEADING_RE = /^\s*([0-9]{6,10})(?![0-9A-Za-z-])/;
const EDGE_TRAILING_RE = /(?<![0-9A-Za-z-])([0-9]{6,10})[\s.,;:!?]*$/;

const COLON_OTP_RE = /[A-Za-zÀ-ÿ]\s*:\s+([A-Za-z0-9]{4,10})(?![A-Za-z0-9])/g;

const CODE_TOKEN_RE = /^[A-Za-z0-9]{4,10}$/;

// Shared by the split extractors: collapse two whitespace-separated digit groups
// (e.g. "123 456") and dash-joined tokens into a single candidate.
function splitMatches(text: string): string[] {
    const matches: string[] = [];
    for (const m of matchAll(TOKEN_DASH_SPLIT_RE, text)) {
        matches.push(m.replace(/-/g, ''));
    }
    matches.push(...oneSeparatorOnly(matchAll(SPACE_SPLIT_DIGITS_RE, text)));
    return dedup(matches.filter((c) => !isWordlike(c)));
}

// ---- Title extractors ----

const titleEnds = defineExtractor({
    name: 'title_ends_code',
    isTitle: true,
    run: ({ subject }) => {
        const splits = subject.split(' ');
        const out: string[] = [];
        if (splits.length && TITLE_ENDS_RE.test(splits[0])) {
            out.push(splits[0]);
        }
        if (splits.length > 1 && TITLE_ENDS_RE.test(splits[splits.length - 1])) {
            out.push(splits[splits.length - 1]);
        }
        return dedup(out);
    },
});

const titleMid = defineExtractor({
    name: 'title_mid_code',
    isTitle: true,
    run: ({ subject }) => dedup(matchAll(TITLE_MID_RE, subject)),
});

const titleSplit = defineExtractor({
    name: 'title_split_code',
    isTitle: true,
    run: ({ subject }) => dedup(oneSeparatorOnly(matchAll(TITLE_SPLIT_RE, subject))),
});

const titleHyphenatedAlpha = defineExtractor({
    name: 'title_hyphenated_alpha_code',
    isTitle: true,
    run: ({ subject }) => dedup(matchAll(HYPHENATED_ALPHA_RE, subject).map((m) => m.replace(/-/g, ''))),
});

const titleEndsHyphenated = defineExtractor({
    name: 'title_ends_hyphenated_code',
    isTitle: true,
    run: ({ subject }) => {
        const splits = subject.split(' ');
        const out: string[] = [];
        if (splits.length && TITLE_ENDS_HYPHENATED_RE.test(splits[0])) {
            out.push(splits[0].replace(/-/g, ''));
        }
        if (splits.length > 1 && TITLE_ENDS_HYPHENATED_RE.test(splits[splits.length - 1])) {
            out.push(splits[splits.length - 1].replace(/-/g, ''));
        }
        return dedup(out);
    },
});

// ---- Body extractors ----

const bodyHtmlNum = defineExtractor({
    name: 'body_html_num_code',
    supportedKinds: HTML_ONLY,
    run: ({ collapsedHtml }) => dedup(matchAll(BODY_TAGS_NUM_RE, collapsedHtml)),
});

const bodyHtmlGeneral = defineExtractor({
    name: 'body_html_general_code',
    supportedKinds: HTML_ONLY,
    run: ({ collapsedHtml }) => {
        const matches = matchAll(BODY_TAGS_GENERAL_RE, collapsedHtml);
        return dedup(matches.filter((m) => !isWordlike(m)));
    },
});

const bodyVisible = defineExtractor({
    name: 'body_visible_code',
    supportedKinds: HTML_ONLY,
    run: ({ visibleText }) => dedup(matchAll(OTP_LONG_RE, visibleText)),
});

const bodyVisibleSplit = defineExtractor({
    name: 'body_visible_split_code',
    supportedKinds: HTML_ONLY,
    run: ({ visibleText }) => splitMatches(visibleText),
});

const bodyEdge = defineExtractor({
    name: 'body_edge_code',
    supportedKinds: BOTH_KINDS,
    run: ({ segments }) => {
        const matches: string[] = [];
        for (const segment of segments) {
            const seg = segment.trim();
            if (!seg) {
                continue;
            }
            const lead = seg.match(EDGE_LEADING_RE);
            if (lead) {
                matches.push(lead[1]);
            }
            const trail = seg.match(EDGE_TRAILING_RE);
            if (trail) {
                matches.push(trail[1]);
            }
        }
        return dedup(matches);
    },
});

const bodyPlainLong = defineExtractor({
    name: 'body_plain_long_code',
    supportedKinds: PLAIN_ONLY,
    run: ({ body }) => dedup(matchAll(OTP_LONG_RE, body)),
});

const bodyPlainSplit = defineExtractor({
    name: 'body_plain_split_code',
    supportedKinds: PLAIN_ONLY,
    run: ({ body }) => splitMatches(body),
});

const bodyPlainShort = defineExtractor({
    name: 'body_plain_short_code',
    supportedKinds: PLAIN_ONLY,
    run: ({ body }) => dedup(matchAll(OTP_SHORT_RE, body)),
});

const bodyColon = defineExtractor({
    name: 'body_colon_code',
    supportedKinds: BOTH_KINDS,
    run: ({ visibleText }) => {
        if (!visibleText) {
            return [];
        }
        return dedup(matchAll(COLON_OTP_RE, visibleText).filter((m) => !isWordlike(m)));
    },
});

const bodyIsolated = defineExtractor({
    name: 'body_isolated_code',
    supportedKinds: BOTH_KINDS,
    run: ({ segments }) => {
        const matches: string[] = [];
        for (const segment of segments) {
            const text = segment.trim();
            if (!text) {
                continue;
            }
            const code = isolatedMatch(text);
            if (code) {
                matches.push(code);
            }
        }
        return dedup(matches);
    },
});

const bodyJoined = defineExtractor({
    name: 'body_joined_code',
    supportedKinds: HTML_ONLY,
    run: ({ doc, visibleText }) => (doc ? joinedSiblingMatches(doc, visibleText) : []),
});

const bodyAttr = defineExtractor({
    name: 'body_attr_code',
    supportedKinds: HTML_ONLY,
    run: ({ doc }) => (doc ? attributeMatches(doc) : []),
});

const bodyCodePhrase = defineExtractor({
    name: 'body_code_phrase_code',
    supportedKinds: BOTH_KINDS,
    run: ({ visibleText }) => {
        if (!visibleText) {
            return [];
        }
        const stripChars = new Set(' \t\n\r.,;:!?()[]{}<>"\'-');
        const tokens = visibleText.split(/\s+/).map((t) => {
            let s = 0;
            let e = t.length;
            while (s < e && stripChars.has(t[s])) {
                s++;
            }
            while (e > s && stripChars.has(t[e - 1])) {
                e--;
            }
            return t.slice(s, e);
        });
        const matches: string[] = [];
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].toLowerCase() !== 'code') {
                continue;
            }
            for (const j of [i - 1, i + 1]) {
                if (j >= 0 && j < tokens.length) {
                    const cand = tokens[j];
                    if (CODE_TOKEN_RE.test(cand) && !isWordlike(cand)) {
                        matches.push(cand);
                    }
                }
            }
        }
        return dedup(matches);
    },
});

const bodyHyphenatedAlpha = defineExtractor({
    name: 'body_hyphenated_alpha_code',
    supportedKinds: BOTH_KINDS,
    run: ({ doc, body }) => {
        const matches: string[] = [];
        if (doc) {
            const all = doc.body ? doc.body.querySelectorAll('*') : [];
            all.forEach((el) => {
                if (el.querySelector('*')) {
                    return;
                }
                const text = clean(el.textContent || '');
                if (HYPHENATED_ALPHA_FULL_RE.test(text)) {
                    matches.push(text.replace(/-/g, ''));
                }
            });
        } else {
            for (const line of body.split(/\r?\n/)) {
                const t = line.trim();
                if (HYPHENATED_ALPHA_FULL_RE.test(t)) {
                    matches.push(t.replace(/-/g, ''));
                }
            }
        }
        return dedup(matches);
    },
});

export {
    titleEnds,
    titleMid,
    titleSplit,
    titleHyphenatedAlpha,
    titleEndsHyphenated,
    bodyHtmlNum,
    bodyHtmlGeneral,
    bodyVisible,
    bodyVisibleSplit,
    bodyEdge,
    bodyPlainLong,
    bodyPlainSplit,
    bodyPlainShort,
    bodyColon,
    bodyIsolated,
    bodyJoined,
    bodyAttr,
    bodyCodePhrase,
    bodyHyphenatedAlpha,
};
