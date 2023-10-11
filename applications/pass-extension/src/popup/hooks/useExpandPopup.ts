import { useCallback } from 'react';

import browser from '@proton/pass/globals/browser';
import { pixelParser } from '@proton/pass/utils/dom';
import noop from '@proton/utils/noop';

export const useExpandPopup = () =>
    useCallback(() => {
        const rootStyles = getComputedStyle(document.documentElement);

        browser.windows
            .create({
                url: browser.runtime.getURL('popup.html'),
                type: 'popup',
                width: pixelParser(rootStyles.getPropertyValue('--popup-width')),
                height: pixelParser(rootStyles.getPropertyValue('--popup-height')),
                focused: true,
            })
            .catch(noop);
    }, []);
