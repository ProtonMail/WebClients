import { chromeAPI } from '@proton/pass/lib/globals/browser';
import type { AsyncCallback, Maybe } from '@proton/pass/types';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import noop from '@proton/utils/noop';

const OFFSCREEN_IDLE_TIME = 2_000;

const createOffscreenDocument = asyncLock((path: string) =>
    chromeAPI.offscreen.createDocument({
        url: path,
        reasons: ['CLIPBOARD'],
        justification: 'being able to clear clipboard after a delay',
    })
);

/** `getContexts` API was introduced in chrome v116.
 * Fallback to `offscreen.hasDocument` if API not available.
 * See: https://developer.chrome.com/docs/extensions/reference/api/offscreen */
const hasOffscreenDocument = async (offscreenUrl: string) => {
    if ('getContexts' in chromeAPI.runtime) {
        // Check all windows controlled by the service worker to see if one
        // of them is the offscreen document with the given path
        const contexts = await chromeAPI.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT'],
            documentUrls: [offscreenUrl],
        });

        return contexts.length > 0;
    }

    return chromeAPI.offscreen.hasDocument();
};

/** Though an extension package can contain multiple offscreen documents,
 * an installed extension can only have one open at a time. If the extension
 * is running in split mode with an active incognito profile, the normal and
 * incognito profiles can each have one offscreen document. */
const setupOffscreenDocument = async (path: string) => {
    const offscreenUrl = chromeAPI.runtime.getURL(path);
    const offscreenExists = await hasOffscreenDocument(offscreenUrl);
    if (!offscreenExists) await createOffscreenDocument(path);
};

export const withOffscreenDocument = (() => {
    let refCount = 0;
    let timer: Maybe<NodeJS.Timeout> = undefined;

    return async <T extends AsyncCallback>(path: string, callback: T): Promise<Awaited<ReturnType<T>>> => {
        try {
            refCount++;
            clearTimeout(timer);
            await setupOffscreenDocument(path);
            return await callback();
        } finally {
            refCount--;

            timer = setTimeout(() => {
                if (refCount <= 0) void chromeAPI.offscreen.closeDocument().catch(noop);
            }, OFFSCREEN_IDLE_TIME);
        }
    };
})();
