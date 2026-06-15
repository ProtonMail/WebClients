// Shared helpers used by multiple extractors. Regexes scoped to a single
// extractor live on that extractor (extractors.ts); regexes consumed by these
// helpers stay here.
import { clean } from '../preprocessing';

const ISOLATED_CODE_RE = /^([A-Za-z0-9]+(?:-[A-Za-z0-9]+)?)$/;
const ISOLATED_SPLIT_RE = /^([0-9]+)[ -]([0-9]+)$/;
const JOINED_OTP_RE = /(?<![A-Za-z0-9-])[A-Za-z0-9]{6,10}(?![A-Za-z0-9-])/g;
const WHITESPACE_RE = /\s+/g;

const MAX_LEAF_LEN = 20;
const METADATA_ATTRS = ['title', 'aria-label', 'alt'];
const METADATA_SKIP_TAGS = new Set(['img']);

export function dedup(matches: Iterable<string>): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const m of matches) {
        if (m && !seen.has(m)) {
            seen.add(m);
            out.push(m);
        }
    }
    return out;
}

export function isWordlike(s: string): boolean {
    if (!/^\p{L}+$/u.test(s)) {
        return false;
    }
    const lower = s.toLowerCase();
    if (s === lower) {
        return true;
    }
    // title-case: first char upper (with a distinct upper form), rest lower
    const first = s[0];
    const rest = s.slice(1);
    return first === first.toUpperCase() && first !== first.toLowerCase() && rest === rest.toLowerCase();
}

export function oneSeparatorOnly(groups: string[]): string[] {
    const out: string[] = [];
    for (const g of groups) {
        let seps = 0;
        for (const c of g) {
            if (c === ' ' || c === '-') {
                seps++;
            }
        }
        if (seps === 1) {
            out.push(g.replace(/[\s-]/g, ''));
        }
    }
    return out;
}

// Run a stateful (global) regex over text, collecting capture group 1 when
// present, else the full match. Mirrors Python `re.findall` semantics.
export function matchAll(re: RegExp, text: string): string[] {
    const out: string[] = [];
    re.lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = re.exec(text))) {
        out.push(m[1] !== undefined ? m[1] : m[0]);
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }
    }
    return out;
}

export function isolatedMatch(text: string): string | null {
    const m1 = text.match(ISOLATED_CODE_RE);
    if (m1) {
        const joined = m1[1].replace(/-/g, '');
        if (joined.length >= 4 && joined.length <= 10 && !isWordlike(joined)) {
            return joined;
        }
    }
    const m2 = text.match(ISOLATED_SPLIT_RE);
    if (m2) {
        const joined = m2[1] + m2[2];
        if (joined.length >= 4 && joined.length <= 10) {
            return joined;
        }
    }
    return null;
}

function isTextLeaf(el: Element): boolean {
    if (el.querySelector('*')) {
        return false;
    }
    const text = clean(el.textContent || '');
    if (!text || text.length > MAX_LEAF_LEN) {
        return false;
    }
    return !text.includes(' ');
}

// Yield maximal runs of adjacent element children sharing the same tag name and
// each being a text-leaf. Any text node or non-leaf child breaks the run.
function adjacentLeafRuns(parent: Element): Element[][] {
    const runs: Element[][] = [];
    let runTag: string | null = null;
    let run: Element[] = [];
    const flush = () => {
        if (run.length) {
            runs.push(run);
        }
    };
    for (const child of Array.from(parent.childNodes)) {
        const isLeaf = child.nodeType === 1 && isTextLeaf(child as Element);
        const tag = isLeaf ? (child as Element).tagName : null;
        if (tag && tag === runTag) {
            run.push(child as Element);
        } else {
            flush();
            run = tag ? [child as Element] : [];
            runTag = tag;
        }
    }
    flush();
    return runs;
}

export function joinedSiblingMatches(doc: Document, visible: string): string[] {
    const visibleCompact = visible.replace(WHITESPACE_RE, '');
    const matches: string[] = [];
    const seen = new Set<string>();
    const root = doc.body;
    if (!root) {
        return matches;
    }
    root.querySelectorAll('*').forEach((parent) => {
        for (const run of adjacentLeafRuns(parent)) {
            const joinedCompact = clean(run.map((c) => c.textContent || '').join('')).replace(WHITESPACE_RE, '');
            for (const match of matchAll(JOINED_OTP_RE, joinedCompact)) {
                if (seen.has(match) || isWordlike(match)) {
                    continue;
                }
                if (visibleCompact.includes(match)) {
                    seen.add(match);
                    matches.push(match);
                }
            }
        }
    });
    return matches;
}

export function attributeMatches(doc: Document): string[] {
    const matches: string[] = [];
    const seen = new Set<string>();
    doc.querySelectorAll('*').forEach((el) => {
        if (METADATA_SKIP_TAGS.has(el.tagName.toLowerCase())) {
            return;
        }
        for (const attr of METADATA_ATTRS) {
            const value = el.getAttribute(attr);
            if (!value) {
                continue;
            }
            for (const match of matchAll(JOINED_OTP_RE, clean(value))) {
                if (seen.has(match) || isWordlike(match)) {
                    continue;
                }
                seen.add(match);
                matches.push(match);
            }
        }
    });
    return matches;
}
