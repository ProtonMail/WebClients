import { useEffect } from 'react';

import { setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

const COOKIE_NAME = 'no-offer';

const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`;

/**
 * Cookie is no longer used.
 * Let's clean it up
 */
const useIsPaidUserCookie = () => {
    useEffect(() => {
        setCookie({
            cookieName: COOKIE_NAME,
            cookieValue: undefined,
            cookieDomain,
            expirationDate: new Date(0).toUTCString(),
            path: '/',
        });
    }, []);
};

export default useIsPaidUserCookie;
