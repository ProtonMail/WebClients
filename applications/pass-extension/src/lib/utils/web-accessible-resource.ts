import browser from '@proton/pass/lib/globals/browser';
import noop from '@proton/utils/noop';

/* `web_accessible_resources` will always have a valid tabId when
 * accessed at their direct URL. If it is served as the top window
 * (and not injected in an iframe), prevent direct access by auto-
 * closing the tab */
if (BUILD_TARGET === 'chrome' && ENV === 'production') {
    if (window.self === window.top) {
        browser.tabs
            .getCurrent()
            .then<any>(({ id }) => id !== undefined && browser.tabs.remove(id))
            .catch(noop);
    }
}
