import { useEffect, useState } from 'react';

import browser from '@proton/pass/lib/globals/browser';
import noop from '@proton/utils/noop';

export const useExpanded = () => {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        (async () => {
            const currentTab = await browser.tabs.getCurrent();
            /**
             * In Chromium-based browsers, currentTab returns `undefined`
             * when called from the extension popup. In Safari, it returns
             * the tab shown under the extension popup instead.
             *
             * Both will report back the ://extension-id/popup.html when opened
             * as a separate window or tab, which is what we're checking here.
             */
            const isExtensionPopupTab = Boolean(
                currentTab.url?.toLowerCase().startsWith(`${window.location.origin}/popup.html`)
            );
            setExpanded(isExtensionPopupTab);
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
