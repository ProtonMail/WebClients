import { useEffect } from 'react';

import { addDays } from 'date-fns';

import { usePreviousSubscription } from '@proton/account/previousSubscription/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getSubscriptionPlanTitle } from '@proton/payments';
import { setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

import { encodeFreeSubscriptionData, encodePaidSubscriptionData } from './encoding';

const COOKIE_NAME = 'st'; // Stands for `Subscription Type`
const today = new Date();
const expirationDate = addDays(today, 60);
const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`;

const setSubscriptionCookie = (cookieValue: string) => {
    setCookie({
        cookieName: COOKIE_NAME,
        cookieValue,
        cookieDomain,
        path: '/',
        expirationDate: expirationDate.toUTCString(),
        secure: true,
    });
};

/**
 * Set subscription information cookie for communication with storefronts
 */
const useSubscriptionStateCookie = () => {
    const [user, loadingUser] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [{ hasHadSubscription }, loadingPreviousSubscription] = usePreviousSubscription();
    const loading = loadingUser || loadingSubscription || loadingPreviousSubscription;

    useEffect(() => {
        if (loading) {
            return;
        }

        // Get current subscription data
        const { planName } = getSubscriptionPlanTitle(user, subscription);
        const cycle = subscription?.Cycle;

        /**
         * Free users
         */
        if (!user.isPaid || !planName || !cycle) {
            const cookieValue = encodeFreeSubscriptionData({ hasHadSubscription });

            setSubscriptionCookie(cookieValue);

            return;
        }

        /**
         * Paid users
         */
        const cookieValue = encodePaidSubscriptionData({ planName, cycle });

        setSubscriptionCookie(cookieValue);
    }, [user, subscription, loading, hasHadSubscription]);
};

export default useSubscriptionStateCookie;
