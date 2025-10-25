import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types';

export const getFirefoxVersion = (() => {
    let version: Maybe<number>;

    return async (): Promise<number> => {
        if (version !== undefined) return version;

        try {
            const info = await browser.runtime.getBrowserInfo();
            return (version = parseInt(info.version.split('.')[0], 10));
        } catch (err) {
            return -1;
        }
    };
})();

/** MAIN world injection support starts on v128.
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/ExecutionWorld */
export const isFirefoxMainWorldInjectionSupported = async () => (await getFirefoxVersion()) >= 128;
