import { useEffect } from 'react';

import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

import { useUser } from './useUser';

const COOKIE_NAME = 'is-paid-user';

const today = new Date();
const lastDayOfTheYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`;

const usePaidCookie = () => {
    const [user] = useUser();

    useEffect(() => {
        const cookie = getCookie(COOKIE_NAME);

        if (user?.isPaid && cookie !== '1') {
            setCookie({
                cookieName: COOKIE_NAME,
                cookieValue: '1',
                cookieDomain,
                expirationDate: lastDayOfTheYear.toUTCString(),
                path: '/',
            });
        } else if (cookie === '1') {
            setCookie({
                cookieName: COOKIE_NAME,
                cookieValue: undefined,
                cookieDomain,
                expirationDate: new Date(0).toUTCString(),
                path: '/',
            });
        }
    }, [user]);
};

export default usePaidCookie;
