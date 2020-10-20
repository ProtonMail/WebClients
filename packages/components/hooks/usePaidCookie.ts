import { useEffect } from 'react';
import { setCookie, checkCookie } from 'proton-shared/lib/helpers/cookies';
import { getSecondLevelDomain } from 'proton-shared/lib/helpers/url';

import { useUser } from './useUser';

const COOKIE_NAME = 'is-paid-user';

const usePaidCookie = () => {
    const [user] = useUser();

    useEffect(() => {
        const secondLevelDomain = getSecondLevelDomain();
        const cookieDomain = `.${secondLevelDomain}`;
        const today = new Date();
        const lastDayOfTheYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);

        if (user.isPaid && !checkCookie(COOKIE_NAME, 'true')) {
            setCookie(COOKIE_NAME, 'true', lastDayOfTheYear.toUTCString(), cookieDomain);
        }
    }, [user]);
};

export default usePaidCookie;
