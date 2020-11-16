import { getSecondLevelDomain, getCookie, setCookie } from '../../../helpers/browser';

/* @ngInject */
function setPaidCookie(userType) {
    const COOKIE_NAME = 'is-paid-user';

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
