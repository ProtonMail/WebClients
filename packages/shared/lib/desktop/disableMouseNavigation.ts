/** Block browser navigation using mouse buttons in Electron applications.
 * While Electron disables keyboard navigation shortcuts by default,
 * mouse navigation buttons still need to be explicitly blocked.
 * - 3: Back button (browser navigation backwards)
 * - 4: Forward button (browser navigation forwards) */
export function disableMouseNavigation() {
    window.addEventListener(
        'mouseup',
        (evt) => {
            if (evt.button === 3 || evt.button === 4) {
                evt.preventDefault();
                evt.stopPropagation();
                return false;
            }
        },
        true
    );
}
