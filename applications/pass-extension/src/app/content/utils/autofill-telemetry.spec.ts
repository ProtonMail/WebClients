import { BUNDLED_MODEL_ID } from '../../../lib/utils/version';
import { CSContext } from '../context/context';

import { getAutofillPageTelemetryDimensions } from './autofill-telemetry';

describe('`getAutofillPageTelemetryDimensions`', () => {
    afterEach(() => {
        CSContext.clear();
        document.documentElement.removeAttribute('lang');
    });

    test('Falls back to the bundled model ID when the content-script context is not set', () => {
        document.documentElement.lang = 'en-US';
        const result = getAutofillPageTelemetryDimensions(document.documentElement);
        expect(result).toEqual({ pageLanguage: 'en-US', modelVersion: BUNDLED_MODEL_ID });
    });

    test('Reads the locked-in model ID from the content-script detector service', () => {
        CSContext.set({ service: { detector: { getModelId: () => '2026.8.2475-lr' } } } as any);
        const result = getAutofillPageTelemetryDimensions(document.documentElement);
        expect(result.modelVersion).toBe('2026.8.2475-lr');
    });

    test('Canonicalizes a valid BCP 47 language tag', () => {
        document.documentElement.lang = 'en';
        expect(getAutofillPageTelemetryDimensions(document.documentElement).pageLanguage).toBe('en');
    });

    test('Returns an empty pageLanguage for a missing or invalid lang attribute', () => {
        expect(getAutofillPageTelemetryDimensions(document.documentElement).pageLanguage).toBe('');

        document.documentElement.lang = 'not-a-real-tag-!!!';
        expect(getAutofillPageTelemetryDimensions(document.documentElement).pageLanguage).toBe('');
    });
});
