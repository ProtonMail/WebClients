import { MAX_ITEM_NAME_LENGTH } from '@proton/pass/constants';
import { domainFallbackAutosaveSiteName } from '@proton/pass/lib/urls/utils/autosave-domain-fallback';
import { isEmptyString } from '@proton/pass/utils/string/is-empty-string';

const readMetaContent = (doc: Document, selector: string): string | null => {
    const content = doc.querySelector(selector)?.getAttribute('content')?.trim();
    return content || null;
};

/** Zero-width and bidi controls that can hide homoglyphs or alter display in item titles. */
const INVISIBLE_META_CHARS = /[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/g;

const normalizeCandidate = (value: string | null | undefined): string | null => {
    if (!value) return null;

    const normalized = value.replace(INVISIBLE_META_CHARS, '').replace(/\s+/g, ' ').trim();
    if (isEmptyString(normalized) || normalized.length > MAX_ITEM_NAME_LENGTH) return null;

    return normalized;
};

/**
 * Resolves a human-friendly service name for autosaved logins (content script only).
 *
 * `og:site_name` and `application-name` are page-controlled and may not match the hostname
 * (e.g. a lookalike domain setting a well-known brand). We accept that trade-off: autofill
 * still keys off the URL, and the default title is a convenience behind PassAutosaveSiteName.
 */
export const resolveAutosaveSiteName = (doc: Document, url: string): string | null => {
    const metaSources = [
        () => readMetaContent(doc, 'meta[property="og:site_name"]'),
        () => readMetaContent(doc, 'meta[name="application-name"]'),
    ];

    for (const resolve of metaSources) {
        const name = normalizeCandidate(resolve());
        if (name) return name;
    }

    return domainFallbackAutosaveSiteName(url);
};
