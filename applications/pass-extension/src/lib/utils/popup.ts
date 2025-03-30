import { isVivaldiBrowser } from 'proton-pass-extension/lib/utils/vivaldi';
import type { Tabs } from 'webextension-polyfill';

import type { PopupController } from '@proton/pass/components/Core/PassCoreProvider';
import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types';
import { pixelParser } from '@proton/pass/utils/dom/computed-styles';
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

/** Adjusts the size of the popup element to account for inconsistent sizing behavior
 * when the user changes the default page zoom in their browser settings. */
export const popupSizeSurgery = () => {
    if (BUILD_TARGET === 'chrome') {
        const rootStyles = getComputedStyle(document.documentElement);
        const popupWidth = pixelParser(rootStyles.getPropertyValue('--popup-width'));

        const onResize = () => {
            const { clientWidth, clientHeight } = document.documentElement;
            if (clientWidth !== popupWidth) {
                document.documentElement.style.setProperty('--popup-width', `${clientWidth}px`);
                document.documentElement.style.setProperty('--popup-height', `${clientHeight}px`);
            }
        };

        isVivaldiBrowser()
            .then((isVivaldi) => {
                if (!isVivaldi) {
                    onResize();
                    window.addEventListener('resize', onResize);
                }
            })
            .catch(noop);
    }
};

export const isExpandedPopup = async (): Promise<boolean> => {
    const currentTab = (await browser.tabs.getCurrent()) as Maybe<Tabs.Tab>;

    if (BUILD_TARGET === 'safari') {
        const url = currentTab?.url;
        const popupPath = `${window.location.origin}/popup.html`;
        /** In Safari, `currentTab` returns the tab behind the extension popup frame.
         * If it matches the current location, then we're expanded in a dedicated tab */
        return Boolean(url?.toLowerCase().startsWith(popupPath));
    }

    /** On chromium based browsers : the current tab will be `undefined`
     * when called from the extension popup frame */
    const expanded = currentTab !== undefined;

    if (expanded) {
        /* when pop-up is expanded: reset the dimension constraints */
        document.documentElement.style.setProperty('--popup-width', '100%');
        document.documentElement.style.setProperty('--popup-height', '100%');
    }

    return expanded;
};

export const createPopupController = (): PopupController => {
    const state = { expanded: false };

    const expand = (subpath?: string) => {
        const rootStyles = getComputedStyle(document.documentElement);

        browser.windows
            .create({
                url: browser.runtime.getURL(`popup.html#${subpath}`),
                type: 'popup',
                width: pixelParser(rootStyles.getPropertyValue('--popup-width')),
                height: pixelParser(rootStyles.getPropertyValue('--popup-height')),
                focused: true,
            })
            .catch(noop);
    };

    popupSizeSurgery();

    isExpandedPopup()
        .then((expanded) => (state.expanded = expanded))
        .catch(noop);

    return {
        expand,
        get expanded() {
            return state.expanded;
        },
    };
};
