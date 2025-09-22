import { asyncLock } from '@proton/pass/utils/fp/promises';

// Offscreen is only working on Chrome at the moment
// `chrome` dedicated api will throw if you try from any other browser
// But as the feature is not available, it would have thrown anyway
export const setupOffscreenDocument = async (path: string) => {
    // Check all windows controlled by the service worker to see if one
    // of them is the offscreen document with the given path
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl],
    });

    if (existingContexts.length > 0) {
        return;
    }

    // create offscreen document
    await asyncLock(() =>
        chrome.offscreen.createDocument({
            url: path,
            reasons: ['CLIPBOARD'],
            justification: 'being able to clear clipboard after a delay',
        })
    )();
};
