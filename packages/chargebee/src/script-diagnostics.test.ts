import { resetCheckpoints } from './checkpoints';
import {
    flattenScriptDiagnostics,
    getScriptDiagnostics,
    getScriptLoadErrors,
    sanitizeScriptUrl,
    summarizeScriptLoadErrors,
} from './script-diagnostics';

const applePaySdk = 'https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js';
const chargebeeJs = 'https://js.chargebee.com/v2/chargebee.js';

/** jsdom does not run the inline listener from index.html, so its writes to the array are faked. */
function failScript(src: string) {
    window.__chargebeeScriptErrors?.push(src);
}

beforeEach(() => {
    resetCheckpoints();
    window.__chargebeeScriptErrors = [];
    window.__chargebeeScriptFailed = false;
    document.head.querySelectorAll('script').forEach((script) => script.remove());

    // The diagnostics read the src off the tag, so the tag index.html ships has to be present.
    const scriptTag = document.createElement('script');
    scriptTag.id = 'chargebee-js';
    scriptTag.src = chargebeeJs;
    document.head.appendChild(scriptTag);
});

describe('getScriptLoadErrors', () => {
    it('should report nothing when the inline listener never ran', () => {
        delete window.__chargebeeScriptErrors;

        expect(getScriptLoadErrors()).toEqual([]);
    });

    it('should keep the failures in the order the inline listener recorded them', () => {
        failScript(chargebeeJs);
        failScript(applePaySdk);

        expect(getScriptLoadErrors()).toEqual([chargebeeJs, applePaySdk]);
    });
});

describe('summarizeScriptLoadErrors', () => {
    it('should report nothing when no script failed', () => {
        expect(summarizeScriptLoadErrors()).toEqual({ scriptLoadErrors: null, scriptLoadErrorCount: 0 });
    });

    it('should join the sources into a primitive that survives Sentry normalization', () => {
        failScript(chargebeeJs);
        failScript(applePaySdk);

        expect(summarizeScriptLoadErrors()).toEqual({
            scriptLoadErrors: `${chargebeeJs} ${applePaySdk}`,
            scriptLoadErrorCount: 2,
        });
    });

    it('should drop the query string of a script injected by chargebee.js', () => {
        window.__chargebeeScriptErrors = ['https://psp.example.com/sdk.js?key=pk_live_secret&session=abc#frag'];

        expect(summarizeScriptLoadErrors()).toEqual({
            scriptLoadErrors: 'https://psp.example.com/sdk.js',
            scriptLoadErrorCount: 1,
        });
    });
});

describe('sanitizeScriptUrl', () => {
    it('should leave a source that carries no query string untouched', () => {
        expect(sanitizeScriptUrl(applePaySdk)).toBe(applePaySdk);
    });

    it('should return an unparseable source as it is', () => {
        expect(sanitizeScriptUrl('inline')).toBe('inline');
    });
});

describe('flattenScriptDiagnostics', () => {
    it('should say whether the Chargebee script failed, and leave the list to the report itself', () => {
        window.__chargebeeScriptErrors = [chargebeeJs, 'https://psp.example.com/sdk.js?key=pk_live_secret'];
        window.__chargebeeScriptFailed = true;

        const flattened = flattenScriptDiagnostics(getScriptDiagnostics());

        expect(flattened.chargebeeScriptFailed).toBe(true);
        expect(flattened.scriptSrc).toBe(chargebeeJs);
        expect(flattened.scriptTagPresent).toBe(true);
    });
});
