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
