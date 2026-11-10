/**
 * MAIN_WINDOW_WEBPACK_ENTRY is `file://` + a runtime `path.resolve(...)`, so on Windows it
 * carries backslashes and only two slashes after the scheme (`file://C:\...`), while
 * webContents.getURL() returns a normalized, percent-encoded URL (`file:///C:/...%20...`).
 * Canonicalize both sides — decode, unify slashes, drop the scheme + leading slashes, and
 * lowercase (Windows paths are case-insensitive) — before comparing.
 */
const canonical = (url: string) => {
    try {
        return decodeURIComponent(url)
            .replace(/\\/g, '/')
            .replace(/^file:\/+/, '')
            .toLowerCase();
    } catch {
        /** A malformed URL (e.g. a lone `%`) can't be the main-window entry — a non-match
         * makes `isMainWindowEntry` return false (the safe "not logged in" default). */
        return '';
    }
};

/** Return true for internal url and false for any navigation outside the app. */
export const isMainWindowEntry = (url: string) => canonical(url).startsWith(canonical(MAIN_WINDOW_WEBPACK_ENTRY));

/** App route to come back to after leaving the app for Account: the account of
 * the `/u/<localID>` route, or of the `localID` param of the add account routes. */
export const getOriginHref = (appUrl: string) => {
    const { hash } = new URL(appUrl);
    const [, localID] = hash.match(/^#\/u\/(\d+)(?:[/?]|$)/) ?? hash.match(/[?&]localID=(\d+)(?:&|$)/) ?? [];
    return localID ? `/u/${localID}` : '/';
};

/** Logged instead of the full URL: the query and fragment can carry fork keys. */
export const getLoggableUrl = (url: string) => url.split(/[?#]/)[0];
