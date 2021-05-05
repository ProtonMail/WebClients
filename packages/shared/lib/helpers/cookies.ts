import isTruthy from './isTruthy';

export const getCookies = (): string[] => {
    try {
        return document.cookie.split(';').map((item) => item.trim());
    } catch (e) {
        return [];
    }
};

export const getCookie = (name: string, cookies = document.cookie) => {
    return `; ${cookies}`.match(`;\\s*${name}=([^;]+)`)?.[1];
};

export const checkCookie = (name: string, value: string) => {
    return getCookies().some((cookie) => cookie.includes(`${name}=${value}`));
};

export enum CookieSameSiteAttribute {
    Lax = 'lax',
    Strict = 'strict',
    None = 'none',
}

export interface SetCookieArguments {
    cookieName: string;
    cookieValue: string | undefined;
    cookieDomain?: string;
    expirationDate?: string;
    path?: string;
    secure?: boolean;
    samesite?: CookieSameSiteAttribute;
}

export const setCookie = ({
    cookieName,
    cookieValue: maybeCookieValue,
    expirationDate: maybeExpirationDate,
    path,
    cookieDomain,
    samesite,
    secure = true,
}: SetCookieArguments) => {
    const cookieValue = maybeCookieValue === undefined ? '' : maybeCookieValue;

    let expirationDate = maybeExpirationDate;

    if (expirationDate === 'max') {
        /* https://en.wikipedia.org/wiki/Year_2038_problem */
        expirationDate = new Date(2147483647000).toUTCString();
    }

    expirationDate = maybeCookieValue === undefined ? new Date(0).toUTCString() : expirationDate;

    document.cookie = [
        `${cookieName}=${cookieValue}`,
        expirationDate && `expires=${expirationDate}`,
        cookieDomain && `domain=${cookieDomain}`,
        path && `path=${path}`,
        secure && 'secure',
        samesite && `samesite=${samesite}`,
    ]
        .filter(isTruthy)
        .join(';');
};

export const deleteCookie = (cookieName: string) => {
    setCookie({
        cookieName,
        cookieValue: undefined,
        path: '/',
    });
};
