import { useEffect } from 'react';

import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

const COOKIE_NAME = 'is-proton-user';
const today = new Date();
const lastDayOfTheYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`;

// Set a cookie for Proton users, used by proton.me website
const useIsProtonUser = () => {
    useEffect(() => {
        const cookie = getCookie(COOKIE_NAME);

        if (cookie !== '1') {
            setCookie({
                cookieName: COOKIE_NAME,
                cookieValue: '1',
                cookieDomain,
                expirationDate: lastDayOfTheYear.toUTCString(),
                path: '/',
            });
        }
    }, []);
};

export default useIsProtonUser;
