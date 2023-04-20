import browser from '@proton/pass/globals/browser';

export const setPopupIcon = (options: { loggedIn: boolean }): Promise<void> =>
    browser.action.setIcon({
        path: {
            16: `./assets/protonpass-icon-16${options.loggedIn ? '' : '-disabled'}.png`,
            32: `./assets/protonpass-icon-32${options.loggedIn ? '' : '-disabled'}.png`,
        },
    });

export const setPopupIconBadge = async (tabId: number, count: number): Promise<void> => {
    await Promise.all([
        await browser.action.setBadgeBackgroundColor({ tabId, color: '#fff' }),
        await browser.action.setBadgeText({ tabId, text: count === 0 ? '' : String(count) }),
    ]);
};
