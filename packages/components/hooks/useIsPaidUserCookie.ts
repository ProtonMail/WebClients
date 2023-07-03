import { useEffect } from 'react';

import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

import { useUser } from './useUser';

const COOKIE_NAME = 'no-offer';
const today = new Date();
const lastDayOfTheYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`;

/**
 * Set a cookie for non eligible user to BF offer
 * Used by proton.me website to hide BF banner
 */
const useIsPaidUserCookie = () => {
    const [user, loadingUser] = useUser();
    const loading = loadingUser;

    useEffect(() => {
        if (loading) {
            return;
        }

        const cookie = getCookie(COOKIE_NAME);
        const isPaid = user.isPaid;
        const shouldSet = isPaid;

        if (shouldSet && cookie !== '1') {
            setCookie({
                cookieName: COOKIE_NAME,
                cookieValue: '1',
                cookieDomain,
                expirationDate: lastDayOfTheYear.toUTCString(),
                path: '/',
            });
        } else if (!shouldSet && cookie === '1') {
            setCookie({
                cookieName: COOKIE_NAME,
                cookieValue: undefined,
                cookieDomain,
                expirationDate: new Date(0).toUTCString(),
                path: '/',
            });
        }
    }, [user, loading]);
};

export default useIsPaidUserCookie;
