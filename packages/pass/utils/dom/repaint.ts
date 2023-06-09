/* eslint-disable @typescript-eslint/no-unused-expressions */

/**
 * Force repaint trick to bypass browser optimization
 * see: https://stackoverflow.com/questions/8840580/force-dom-redraw-refresh-on-chrome-mac
 */
export const repaint = (el: HTMLElement) => {
    el.style.display = 'none';
    el.offsetHeight;
    el.style.display = '';
};
