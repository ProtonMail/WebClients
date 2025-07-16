import browser from '@proton/pass/lib/globals/browser';

// A global promise to avoid concurrency issues
let creating: Promise<void> | null = null;

export const setupOffscreenDocument = async (path: string) => {
    // Check all windows controlled by the service worker to see if one
    // of them is the offscreen document with the given path
    const offscreenUrl = browser.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl],
    });

    if (existingContexts.length > 0) {
        return;
    }

    // create offscreen document
    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['CLIPBOARD'],
            justification: 'being able to clear clipboard after a delay',
        });
        await creating;
        creating = null;
    }
};
