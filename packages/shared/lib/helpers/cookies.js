export const getCookies = () => {
    try {
        return document.cookie.split(';').map((item) => item.trim());
    } catch (e) {
        return [];
    }
};

export const checkCookie = (name, value) => {
    return getCookies().some((cookie) => cookie.includes(`${name}=${value}`));
};
