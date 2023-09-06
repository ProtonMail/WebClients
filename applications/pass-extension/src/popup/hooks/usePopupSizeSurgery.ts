import { pixelParser } from '@proton/pass/utils/dom';

/* Adjusts the size of the popup element to account for inconsistent izing behavior
 * when the user changes the default page zoom in their browser settings. */
export const usePopupSizeSurgery = () => {
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

        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }
};
