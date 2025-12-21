import { useEffect, useState } from 'react';

import type { Tabs } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types/utils/index';
import noop from '@proton/utils/noop';

export const useExpanded = () => {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        (async () => {
            const currentTab = (await browser.tabs.getCurrent()) as Maybe<Tabs.Tab>;

            const isPopupTab = (() => {
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
