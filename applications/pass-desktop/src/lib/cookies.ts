const SAME_SITE_RE = /samesite=(strict|lax|none)/gi;
const SET_COOKIE_HEADERS = ['set-cookie', 'Set-Cookie'];

/** Adds `SameSite=None` if not present */
const upgradeSameSite = (cookie: string): string =>
    SAME_SITE_RE.test(cookie) ? cookie : cookie.trim() + '; SameSite=None';

/** Replaces any SameSite directive with `SameSite=None` */
const migrateSameSite = (cookie: string): string =>
    SAME_SITE_RE.test(cookie) ? cookie.replaceAll(SAME_SITE_RE, 'SameSite=None') : cookie.trim() + '; SameSite=None';

/** `file://` protocol cannot forward strict cookies. Re-write the SameSite
 * directives to allow cookie based authentication in the packaged app */
const processCookies = (headers: Record<string, string[]>, process: (cookie: string) => string) => {
    SET_COOKIE_HEADERS.forEach((key) => {
        if (headers[key]?.length > 0) {
            headers[key] = headers[key].map(process);
        }
    });
};

export const upgradeSameSiteCookies = (headers: Record<string, string[]>) => processCookies(headers, upgradeSameSite);
export const migrateSameSiteCookies = (headers: Record<string, string[]>) => processCookies(headers, migrateSameSite);
