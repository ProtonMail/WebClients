/** A malformed URL (e.g. a lone `%`) can't be decoded: compare it as written. */
const decode = (url: string) => {
    try {
        return decodeURIComponent(url);
    } catch {
        return url;
    }
};

/**
 * MAIN_WINDOW_WEBPACK_ENTRY is `file://` + a raw runtime `path.resolve(...)`, so on Windows it
 * carries backslashes and only two slashes after the scheme (`file://C:\...`), while
 * webContents.getURL() returns a normalized, percent-encoded URL (`file:///C:/...%20...`).
 * Only the latter is decoded: decoding the raw path would turn a folder like `a%41b` into `aAb`.
 * Then unify slashes, drop the scheme + leading slashes, and lowercase (Windows paths are
 * case-insensitive) before comparing.
 */
const normalize = (path: string) =>
    path
        .replace(/\\/g, '/')
        .replace(/^file:\/+/, '')
        .toLowerCase();

/** Return true for internal url and false for any navigation outside the app. */
export const isMainWindowEntry = (url: string) =>
    normalize(decode(url)).startsWith(normalize(MAIN_WINDOW_WEBPACK_ENTRY));

/** App route to come back to after leaving the app for Account: the account of
 * the `/u/<localID>` route, or of the `localID` param of the add account routes. */
export const getOriginHref = (appUrl: string) => {
    const { hash } = new URL(appUrl);
    const [, localID] = hash.match(/^#\/u\/(\d+)(?:[/?]|$)/) ?? hash.match(/[?&]localID=(\d+)(?:&|$)/) ?? [];
    return localID ? `/u/${localID}` : '/';
};

/** Logged instead of the full URL: the query and fragment can carry fork keys. */
export const getLoggableUrl = (url: string) => url.split(/[?#]/)[0];
