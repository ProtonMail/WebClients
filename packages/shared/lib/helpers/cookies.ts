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

export interface SetCookieArguments {
    cookieName: string;
    cookieValue: string | undefined;
    expirationDate?: string;
    path?: string;
    cookieDomain?: string;
}

export const setCookie = ({
    cookieName,
    cookieValue: maybeCookieValue,
    expirationDate: maybeExpirationDate,
    path,
    cookieDomain,
}: SetCookieArguments) => {
    const expirationDate = maybeExpirationDate === undefined ? new Date(0).toUTCString() : maybeExpirationDate;
    const cookieValue = maybeCookieValue === undefined ? '' : maybeCookieValue;
    document.cookie = [
        `${cookieName}=${cookieValue}`,
        expirationDate && `expires=${expirationDate}`,
        cookieDomain && `domain=${cookieDomain}`,
        path && `path=${path}`,
    ]
        .filter(isTruthy)
        .join(';');
};
