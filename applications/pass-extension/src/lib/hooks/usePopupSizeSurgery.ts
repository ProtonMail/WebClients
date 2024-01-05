import { useEffect } from 'react';

import { pixelParser } from '@proton/pass/utils/dom/computed-styles';
import noop from '@proton/utils/noop';

import { isVivaldiBrowser } from '../utils/vivaldi';

/** Adjusts the size of the popup element to account for inconsistent sizing behavior
 * when the user changes the default page zoom in their browser settings. */
export const usePopupSizeSurgery = () => {
    useEffect(() => {
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

            return () => window.removeEventListener('resize', onResize);
        }
    }, []);
};
