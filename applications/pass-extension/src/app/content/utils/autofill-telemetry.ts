import type { AutofillPageTelemetryDimensions } from '@proton/pass/types/data/telemetry';

/** Validates and canonicalizes a BCP 47 language tag using the platform's own parser. */
const toValidPageLanguage = (lang: string | undefined): string => {
    try {
        return lang ? Intl.getCanonicalLocales([lang])[0] : '';
    } catch {
        return '';
    }
};

/** _element is unused today but future telemetry may need to look at it. */
export const getAutofillPageTelemetryDimensions = (_element: Element): AutofillPageTelemetryDimensions => ({
    /* while theoretically the lang attribute can be set anywhere,
       in practice after evaluating many samples ~98% of them only
       set the lang attribute on the document root and nowhere else */
    // documentElement isn't always an HTMLElement (eg: XML/SVG docs), so `.lang` can be undefined
    pageLanguage: toValidPageLanguage((document.documentElement as Partial<HTMLElement>).lang),
});
