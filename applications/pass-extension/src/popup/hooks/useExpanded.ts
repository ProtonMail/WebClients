import { useEffect, useState } from 'react';

import browser from '@proton/pass/globals/browser';
import noop from '@proton/utils/noop';

export const useExpanded = () => {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        browser.tabs
            .getCurrent()
            .then((tab) => setExpanded(tab !== undefined))
            .catch(noop);
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
