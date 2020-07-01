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
