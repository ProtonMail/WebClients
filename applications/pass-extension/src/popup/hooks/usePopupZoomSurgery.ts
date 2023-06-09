import { pixelParser } from '@proton/pass/utils/dom';

/* Adjusts the zoom level on the `<html>` element to account for inconsistent
 * sizing behavior of the extension popup when the user changes the default
 * page zoom in their browser settings. The popup's max dimensions are bounded
 * by the browser, so we compute the approximate scale factor and apply it to
 * the zoom level on the `<html>` tag */
export const usePopupZoomSurgery = () => {
    const handleResize = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const popupWidth = pixelParser(rootStyles.getPropertyValue('--popup-width'));
        const windowWidth = window.innerWidth;

        const scaleFactor = windowWidth / popupWidth;

        if (scaleFactor >= 1) return document.documentElement.style.removeProperty('zoom');
        return document.documentElement.style.setProperty('zoom', scaleFactor.toFixed(5));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
};
