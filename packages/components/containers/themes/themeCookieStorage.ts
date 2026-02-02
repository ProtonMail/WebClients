import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

const THEME_COOKIE_NAME = 'Theme';

export const getStoredThemeString = () => {
    return getCookie(THEME_COOKIE_NAME);
};

export const setStoredThemeString = (value: string | undefined) => {
    // Note: We might set `undefined` which will clear the cookie
    setCookie({
        cookieName: THEME_COOKIE_NAME,
        cookieValue: value,
        cookieDomain: getSecondLevelDomain(window.location.hostname),
        path: '/',
        expirationDate: 'max',
    });
};
