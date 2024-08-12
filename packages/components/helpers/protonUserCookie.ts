import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

const IS_PROTON_USER_COOKIE_NAME = 'is-proton-user';
const today = new Date();
const oneYearFromToday = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
const cookieValue = '1';

// Set a cookie for Proton users, used by proton.me website
// Also use in Drive download page to show/hide some marketing info
export const setIsProtonUserCookie = () => {
    const cookie = getCookie(IS_PROTON_USER_COOKIE_NAME);

    if (cookie !== cookieValue) {
        const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`;
        setCookie({
            cookieName: IS_PROTON_USER_COOKIE_NAME,
            cookieValue: cookieValue,
            cookieDomain,
            expirationDate: oneYearFromToday.toUTCString(),
            path: '/',
        });
    }

    return cookie;
};

// This is a cheap way to see if the current session is a proton user but it is not an totally accurate way!
// Use with that in mind, most not be used for business critical features but more for marketing usage, upsells, etc... (which would not add additional api backend usage).
// Example alternative:
// - For Drive UrlsApp, more reliable way is to use isSessionProtonUser() method from the usePublicSession hook which infers if the current session is a proton user or not based on the response from the /auth API.
export const isProtonUserFromCookie = () => {
    const cookie = getCookie(IS_PROTON_USER_COOKIE_NAME);
    return cookie === cookieValue;
};
