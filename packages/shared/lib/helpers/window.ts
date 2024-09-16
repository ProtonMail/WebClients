/**
 * A handle representing a JavaScript {@link Window}, useful for dealing with
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
 * @example
 *
 * const w = getNewWindow();
 *
 * try {
 *     const result = await somethingAsynchronous();
 *     w.handle.location = new URL(result);
 * } catch (e) {
 *     reportError(e);
 *     // Close the window if the call fails (edge case)
 *     w.close();
 * }
 */
export const getNewWindow = (): WindowHandle => {
    const handle = window.open('', '_blank');

    if (!handle) {
        // In case we weren't able to open a new window,
        // let's fall back to opening in the current tab.

        // eslint-disable-next-line no-console
        console.warn('Failed to open new window, using current tab');

        return getCurrentTab();
    }

    return {
        handle,
        close: () => handle.close(),
    };
};
