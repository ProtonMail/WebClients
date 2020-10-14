import isTruthy from './isTruthy';

export const getCookies = (): string[] => {
    try {
        return document.cookie.split(';').map((item) => item.trim());
    } catch (e) {
        return [];
    }
};

export const checkCookie = (name: string, value: string) => {
    return getCookies().some((cookie) => cookie.includes(`${name}=${value}`));
};

export const setCookie = (cookieName: string, cookieValue: string, expirationDate?: string, cookieDomain?: string) => {
    document.cookie = [
        `${cookieName}=${cookieValue}`,
        expirationDate && `expires=${expirationDate}`,
        cookieDomain && `domain=${cookieDomain}`,
    ]
        .filter(isTruthy)
        .join(';');
};
