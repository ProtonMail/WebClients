import browser from '@proton/pass/globals/browser';
import noop from '@proton/utils/noop';

export const setPopupIcon = (options: { loggedIn: boolean }): Promise<void> =>
    browser.action.setIcon({
        path: {
            16: `./assets/protonpass-icon-16${options.loggedIn ? '' : '-disabled'}.png`,
            32: `./assets/protonpass-icon-32${options.loggedIn ? '' : '-disabled'}.png`,
        },
    });

/* this function should gracefully fail if the tabId
 * does not exist or has been discarded when calling it*/
export const setPopupIconBadge = async (tabId: number, count: number): Promise<void> => {
    await Promise.all([
        browser.action.setBadgeBackgroundColor({ tabId, color: '#fff' }).catch(noop),
        browser.action.setBadgeText({ tabId, text: count === 0 ? '' : String(count) }).catch(noop),
    ]);
};
