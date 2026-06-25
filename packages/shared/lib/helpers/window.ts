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
 * When `url` is provided the tab opens directly to that URL, avoiding the
 * `about:blank` → navigate two-step that ad-blockers flag as a popup redirect.
 * Pass a URL whenever it can be computed synchronously (i.e. before any async
 * work). Omit it only when the URL is not yet known at the time the window
 * must be opened (e.g. the URL depends on an in-flight API call).
 *
 * @example — URL known upfront (preferred)
 *
 * getNewWindow(url.toString());
 *
 * @example — URL unknown at open time (async gap)
 *
 * const w = getNewWindow();
 *
 * try {
 *     const result = await somethingAsynchronous();
 *     w.handle.location.assign(new URL(result));
 * } catch (e) {
 *     reportError(e);
 *     w.close();
 * }
 */
export const getNewWindow = (url?: string): WindowHandle => {
    const handle = window.open(url ?? '', '_blank');

    if (!handle) {
        // In case we weren't able to open a new window,
        // let's fall back to opening in the current tab.

        // eslint-disable-next-line no-console
        console.warn('Failed to open new window, using current tab');

        if (url) {
            window.location.assign(url);
        }

        return getCurrentTab();
    }

    return {
        handle,
        close: () => handle.close(),
    };
};
