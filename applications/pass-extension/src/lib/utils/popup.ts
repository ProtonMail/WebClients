import { isVivaldiBrowser } from 'proton-pass-extension/lib/utils/vivaldi';
import type { Tabs } from 'webextension-polyfill';

import type { PopupController } from '@proton/pass/components/Core/PassCoreProvider';
import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types';
import { pixelParser } from '@proton/pass/utils/dom/computed-styles';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

export const setPopupIcon = safeCall((options: { disabled: boolean; locked: boolean }): Promise<void> => {
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
});

/* this function should gracefully fail if the tabId
 * does not exist or has been discarded when calling it*/
export const setPopupIconBadge = safeCall(async (tabId: number, count: number): Promise<void> => {
    void browser.action.setBadgeText({ tabId, text: count === 0 ? '' : String(count) });
});

/** Adjusts the size of the popup element to account for inconsistent sizing behavior
 * when the user changes the default page zoom in their browser settings. */
export const popupSizeSurgery = () => {
    if (BUILD_TARGET === 'chrome') {
        const onResize = debounce(() => {
            const { clientWidth, clientHeight } = document.documentElement;
            const rootStyles = getComputedStyle(document.documentElement);
            const popupWidth = pixelParser(rootStyles.getPropertyValue('--popup-width'));

            /** Only resize if difference > 1px to ignore floating point rounding
             * This prevents the gradual shrinking loop reported on ChromeOS */
            if (Math.abs(clientWidth - popupWidth) > 1) {
                document.documentElement.style.setProperty('--popup-width', `${clientWidth}px`);
                document.documentElement.style.setProperty('--popup-height', `${clientHeight}px`);
            }
        }, 50);

        isVivaldiBrowser()
            .then((isVivaldi) => {
                if (!isVivaldi) {
                    onResize();
                    onResize.flush();
                    window.addEventListener('resize', onResize);
                }
            })
            .catch(noop);
    }
};

export const isExpandedPopup = async (): Promise<boolean> => {
    try {
        const currentTab = (await browser.tabs.getCurrent()) as Maybe<Tabs.Tab>;

        const expanded = (() => {
            if (BUILD_TARGET === 'safari') {
                const url = currentTab?.url;
                const popupPath = `${window.location.origin}/popup.html`;
                /** In Safari, `currentTab` returns the tab behind the extension popup frame.
                 * If it matches the current location, then we're expanded in a dedicated tab */
                return Boolean(url?.toLowerCase().startsWith(popupPath));
            }

            /** On chromium based browsers : the current tab will be `undefined`
             * when called from the extension popup frame */
            return currentTab !== undefined;
        })();

        if (expanded) {
            /* when pop-up is expanded: reset the dimension constraints */
            document.documentElement.style.setProperty('--popup-width', '100%');
            document.documentElement.style.setProperty('--popup-height', '100%');
        }

        return expanded;
    } catch {
        return false;
    }
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

    isExpandedPopup()
        .then((expanded) => {
            /** Only apply popup surgery for non-expanded popups */
            if (!expanded) popupSizeSurgery();
            state.expanded = expanded;
        })
        .catch(noop);

    return {
        expand,
        get expanded() {
            return state.expanded;
        },
    };
};
