/* eslint-disable @typescript-eslint/no-unused-expressions */

/** Forces a browser repaint of the given element. This function uses the
 * "forced reflow" technique to ensure immediate layout updates. It's useful
 * when accurate measurements are needed right after DOM changes, especially
 * in content scripts or on browsers that may delay or trash layout calculations.
 * Note: Use sparingly as frequent use can impact performance.*/
export const repaint = (...els: HTMLElement[]) => {
    els.forEach((el) => {
        const transform = el.style.transform;
        el.style.transform = 'translateZ(0)'; /* new stacking context */
        el.offsetHeight; /* trigger reflow by accessing offsetHeight */
        el.style.transform = transform; /* restore transform */
    });
};
