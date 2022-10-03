import { useEffect } from 'react';

import { fromUnixTime, isAfter } from 'date-fns';

import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

import useLastSubscriptionEnd from './useLastSubscriptionEnd';
import { useUser } from './useUser';

const COOKIE_NAME = 'no-bf-2022';
const today = new Date();
const FIRST_OCTOBER_2022 = new Date(2022, 9, 1);
const lastDayOfTheYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`;

const useBFCookie = () => {
    const [user, loadingUser] = useUser();
    const [lastSubscriptionEnd, loadingLastSubscriptionEnd] = useLastSubscriptionEnd();
    const loading = loadingUser || loadingLastSubscriptionEnd;

    useEffect(() => {
        if (loading) {
            return;
        }

        const cookie = getCookie(COOKIE_NAME);
        const isPaid = user.isPaid;
        const isInvalidFree = user.isFree && isAfter(fromUnixTime(lastSubscriptionEnd), FIRST_OCTOBER_2022);

        if ((isPaid || isInvalidFree) && cookie !== '1') {
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
    }, [user, lastSubscriptionEnd, loading]);
};

export default useBFCookie;
