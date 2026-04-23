import { useEffect, useState } from 'react';

import type { Tabs } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types/utils/index';
import noop from '@proton/utils/noop';

export const useExpanded = () => {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        (async () => {
            const isPopupTab = await (async () => {
                if (BUILD_TARGET === 'safari') {
                    /** In Safari, `browser.tabs.getCurrent()` called from the popover returns
                     * the tab behind it — so a URL check fails when the tab behind is itself
                     * the expanded popup.html. Ask the extension for its "popup" views: the
                     * popover window is listed there, the expanded tab is not. */
                    const popupViews = browser.extension.getViews({ type: 'popup' });
                    return !popupViews.includes(window);
                }

                /** On chromium based browsers : the current tab will be `undefined`
                 * when called from the extension popup frame */
                const currentTab = (await browser.tabs.getCurrent()) as Maybe<Tabs.Tab>;
                return currentTab !== undefined;
            })();

            setExpanded(isPopupTab);
        })().catch(noop);
    }, []);

    useEffect(() => {
        if (expanded) {
            /* when pop-up is expanded: reset the dimension constraints */
            document.documentElement.style.setProperty('--popup-width', '100%');
            document.documentElement.style.setProperty('--popup-height', '100%');
        }
    }, [expanded]);

    return expanded;
};
