import type { AutofillPageTelemetryDimensions } from '@proton/pass/types/data/telemetry';

/** _element is unused today but future telemetry may need to look at it. */
export const getAutofillPageTelemetryDimensions = (_element: Element): AutofillPageTelemetryDimensions => ({
    /* while theoretically the lang attribute can be set anywhere,
       in practice after evaluating many samples ~98% of them only
       set the lang attribute on the document root and nowhere else */
    pageLanguage: document.documentElement.lang,
});
