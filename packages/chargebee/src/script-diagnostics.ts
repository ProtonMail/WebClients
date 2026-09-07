declare global {
    interface Window {
        __chargebeeScriptErrors?: string[];
        __chargebeeScriptFailed?: boolean;
    }
}

/**
 * Only whether the browser recorded a request for the script. The timings themselves are useless
 * here: `js.chargebee.com` does not send `Timing-Allow-Origin`, so a cross-origin resource reports
 * zero for every size and duration however the request actually went.
 */
export type ResourceTimingLookup =
    { status: 'found' } | { status: 'absent' } | { status: 'unavailable'; reason: string };

export type ScriptDiagnostics = {
    /** Whether the Chargebee script tag itself fired an error, identified by its id in index.html. */
    chargebeeScriptFailed: boolean;
    /** `src` of the Chargebee script tag. The backend fills this in per environment. */
    scriptSrc: string | null;
    /** Whether the script tag element is still present in the document. */
    scriptTagPresent: boolean;
    resourceTiming: ResourceTimingLookup;
};

function getScriptTag(): HTMLScriptElement | null {
    if (typeof document === 'undefined') {
        return null;
    }

    return document.querySelector<HTMLScriptElement>('#chargebee-js');
}

function getResourceTiming(scriptSrc: string | null): ResourceTimingLookup {
    if (scriptSrc === null) {
        return { status: 'unavailable', reason: 'no-script-tag' };
    }

    const entries = performance?.getEntriesByType?.('resource');

    if (entries === undefined) {
        return { status: 'unavailable', reason: 'no-resource-timing-api' };
    }

    if (entries.length === 0) {
        /**
         * The page always fetches at least the Chargebee script, so an empty list means the browser
         * is not recording them, not that nothing was requested.
         */
        return { status: 'unavailable', reason: 'empty-resource-buffer' };
    }

    return entries.some((entry) => entry.name === scriptSrc) ? { status: 'found' } : { status: 'absent' };
}

/**
 * Query strings are removed. Our own script URLs are fixed, but the payment scripts Chargebee adds
 * are not ours and may put a key or a session id in one.
 */
export function sanitizeScriptUrl(src: string): string {
    try {
        // No base needed: `src` is either already absolute or the literal "inline".
        const url = new URL(src);
        return `${url.origin}${url.pathname}`;
    } catch (error) {
        return src;
    }
}

/**
 * The listener in index.html is the only one. It is registered before the Chargebee script tag, so
 * it is the only thing that can see that tag fail — module code here starts too late. It stays
 * registered for the life of the page, so it also catches the Apple Pay script and the payment
 * scripts Chargebee adds later. If a browser blocked that inline script, nothing recorded the
 * failures and this list is empty.
 */
export function getScriptLoadErrors(): string[] {
    return window.__chargebeeScriptErrors ?? [];
}

/**
 * Sentry's `normalizeDepth: 5` replaces anything non-primitive nested this deep in an event with
 * "[Array]"/"[Object]", so the sources are joined into one string and the count is sent separately.
 */
export function summarizeScriptLoadErrors(): { scriptLoadErrors: string | null; scriptLoadErrorCount: number } {
    try {
        const errors = getScriptLoadErrors();

        return {
            scriptLoadErrors: errors.map(sanitizeScriptUrl).join(' ') || null,
            scriptLoadErrorCount: errors.length,
        };
    } catch (error) {
        return { scriptLoadErrors: null, scriptLoadErrorCount: 0 };
    }
}

export function getScriptDiagnostics(): ScriptDiagnostics {
    const scriptTag = getScriptTag();
    const scriptSrc = scriptTag?.src ?? null;

    return {
        chargebeeScriptFailed: window.__chargebeeScriptFailed ?? false,
        scriptSrc,
        scriptTagPresent: scriptTag !== null,
        resourceTiming: getResourceTiming(scriptSrc),
    };
}

/**
 * Why `window.Chargebee` is missing. Used as the error message so each cause becomes its own Sentry
 * issue instead of one shared "Chargebee did not load".
 */
export function getScriptFailureReason(diagnostics: ScriptDiagnostics): string {
    if (diagnostics.chargebeeScriptFailed) {
        return 'Chargebee script failed to load';
    }

    if (diagnostics.resourceTiming.status === 'absent') {
        return 'Chargebee script request never completed';
    }

    if (diagnostics.resourceTiming.status === 'unavailable') {
        return 'Chargebee script is missing for an undetermined reason';
    }

    return 'Chargebee script loaded but did not run';
}

/**
 * Sentry only keeps several levels of nesting. Anything deeper that is not a plain value arrives as
 * "[Object]" or "[Array]", so everything here is flattened into single values.
 */
export function flattenScriptDiagnostics(diagnostics: ScriptDiagnostics) {
    const { resourceTiming } = diagnostics;

    return {
        scriptSrc: diagnostics.scriptSrc,
        scriptTagPresent: diagnostics.scriptTagPresent,
        chargebeeScriptFailed: diagnostics.chargebeeScriptFailed,
        resourceTimingStatus: resourceTiming.status,
        resourceTimingReason: resourceTiming.status === 'unavailable' ? resourceTiming.reason : null,
    };
}
