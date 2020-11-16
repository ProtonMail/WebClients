/* @ngInject */
function setPaidCookie(userType) {
    const COOKIE_NAME = 'is-paid-user';

    const getSecondLevelDomain = () => {
        const { hostname } = window.location;
        return hostname.substr(hostname.indexOf('.') + 1);
    };

    const getCookie = (name, cookies = document.cookie) => {
        return `; ${cookies}`.match(`;\\s*${name}=([^;]+)`)?.[1];
    };

    const setCookie = ({
        cookieName,
        cookieValue: maybeCookieValue,
        expirationDate: maybeExpirationDate,
        path,
        cookieDomain
    }) => {
        const expirationDate = maybeCookieValue === undefined ? new Date(0).toUTCString() : maybeExpirationDate;
        const cookieValue = maybeCookieValue === undefined ? '' : maybeCookieValue;
        document.cookie = [
            `${cookieName}=${cookieValue}`,
            expirationDate && `expires=${expirationDate}`,
            cookieDomain && `domain=${cookieDomain}`,
            path && `path=${path}`
        ]
            .filter(Boolean)
            .join(';');
    };

    return () => {
        const { isPaid } = userType();
        const today = new Date();
        const lastDayOfTheYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
        const cookieDomain = `.${getSecondLevelDomain()}`;

        if (isPaid && getCookie(COOKIE_NAME) !== '1') {
            setCookie({
                cookieName: COOKIE_NAME,
                cookieValue: '1',
                cookieDomain,
                expirationDate: lastDayOfTheYear.toUTCString(),
                path: '/'
            });
        }
    };
}

export default setPaidCookie;
