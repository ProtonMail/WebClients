import debounce from 'lodash/debounce';
import { isVivaldiBrowser } from 'proton-pass-extension/lib/utils/vivaldi';
import type { Tabs } from 'webextension-polyfill';

import type { PopupController } from '@proton/pass/components/Core/PassCoreProvider';
import { clientDisabled, clientLocked, clientOffline } from '@proton/pass/lib/client';
import browser from '@proton/pass/lib/globals/browser';
import type { AppStatus } from '@proton/pass/types';
import type { Maybe } from '@proton/pass/types/utils/index';
import { pixelParser } from '@proton/pass/utils/dom/computed-styles';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import noop from '@proton/utils/noop';

export const setPopupIcon = safeCall((status: AppStatus): void => {
    const suffix = (() => {
        if (clientOffline(status)) return '-offline';
        if (clientDisabled(status)) return '-disabled';
        if (clientLocked(status)) return '-locked';
        return '';
    })();

    browser.action
        .setIcon({
            path: {
                16: `./assets/protonpass-icon-16${suffix}.png`,
                32: `./assets/protonpass-icon-32${suffix}.png`,
            },
        })
        .catch(noop);
});

/* this function should gracefully fail if the tabId
 * does not exist or has been discarded when calling it */
export const setPopupIconBadge = safeCall((tabId: number, count: number): void => {
    browser.action.setBadgeText({ tabId, text: count === 0 ? '' : String(count) }).catch(noop);
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
        let expanded: boolean;

        if (BUILD_TARGET === 'safari') {
            /** In Safari, `browser.tabs.getCurrent()` called from the popover returns
             * the tab behind it — so a URL check fails when the tab behind is itself
             * the expanded popup.html. Ask the extension for its "popup" views: the
             * popover window is listed there, the expanded tab is not. */
            const popupViews = browser.extension.getViews({ type: 'popup' });
            expanded = !popupViews.includes(window);
        } else {
            /** On chromium based browsers : the current tab will be `undefined`
             * when called from the extension popup frame */
            const currentTab = (await browser.tabs.getCurrent()) as Maybe<Tabs.Tab>;
            expanded = currentTab !== undefined;
        }

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
        browser.tabs
            .create({
                url: browser.runtime.getURL(`popup.html#${subpath ?? ''}`),
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
