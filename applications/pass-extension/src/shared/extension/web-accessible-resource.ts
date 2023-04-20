import browser from '@proton/pass/globals/browser';

/* On chrome `web_accessible_resources` will not be returned
 * from a Tabs query if opened in a tab at their runtime url.
 * leverage this to detect direct access */
if (BUILD_TARGET === 'chrome' && ENV === 'production') {
    if (window.self === window.top) {
        void browser.tabs.query({ active: true, currentWindow: true, status: 'complete' }).then(async (tabs) => {
            return tabs.length === 0 && (await browser.tabs.remove((await browser.tabs.getCurrent()).id!));
        });
    }
}
