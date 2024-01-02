import browser from '@proton/pass/lib/globals/browser';
import noop from '@proton/utils/noop';

export const setPopupIcon = (options: { disabled: boolean; locked: boolean }): Promise<void> => {
    let suffix = '';
    if (options.disabled) suffix = '-disabled';
    if (options.locked) suffix = '-locked';

    return browser.action
        .setIcon({
            path: {
                16: `./assets/protonpass-icon-16${suffix}.png`,
                32: `./assets/protonpass-icon-32${suffix}.png`,
            },
        })
        .catch(noop);
};

/* this function should gracefully fail if the tabId
 * does not exist or has been discarded when calling it*/
export const setPopupIconBadge = (tabId: number, count: number): Promise<void> =>
    browser.action.setBadgeText({ tabId, text: count === 0 ? '' : String(count) }).catch(noop);
