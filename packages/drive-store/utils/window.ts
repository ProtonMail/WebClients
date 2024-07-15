/**
 * A handle representing a JavaScript `Window`, useful for dealing with
 * new windows in async contexts and avoiding popup blockers.
 *
 * @see {@link getNewWindow}
 */
export type WindowHandle = {
    /** Actual JS Window object */
    handle: Window;
    /** Closes the window in case of failure */
    close: () => void;
};

/**
 * Creates a {@link WindowHandle} for the current window, used as a fallback when opening new tabs.
 *
 * Close is a no-op.
 *
 * @see {@link getNewWindow}
 */
export const getCurrentTab = (): WindowHandle => ({
    handle: window,
    close: () => {},
});

/**
 * Creates a {@link WindowHandle} for a new tab. Falls back to the current tab.
 *
 * Intended usage is as follows:
 * - Create the window handle `w`
 * - Perform async calls
 * - Navigate the window to the URL based on async result
 *     - `w.handle.location = new URL(...)`
 * - Close the window with `w.close()` if the async call fails
 */
export const getNewWindow = (): WindowHandle => {
    const handle = window.open('', '_blank');

    if (!handle) {
        // In case we weren't able to open a new window,
        // let's fall back to opening in the current tab.
        console.warn('Failed to open new window, using current tab');

        return getCurrentTab();
    }

    return {
        handle,
        close: () => handle.close(),
    };
};
