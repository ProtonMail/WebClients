import { useEffect } from 'react';

import { usePreviousSubscription } from '@proton/account/previousSubscription/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getSubscriptionPlanTitle } from '@proton/payments';
import { setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

import { encodeFreeSubscriptionData, encodePaidSubscriptionData } from './encoding';

const DEBUG_SUBSCRIPTION_STATE_COOKIE = true;
const COOKIE_NAME = 'st'; // Stands for `Subscription Type`
const today = new Date();
const lastDayOfTheYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`;

const setSubscriptionCookie = (cookieValue: string) => {
    setCookie({
        cookieName: COOKIE_NAME,
        cookieValue,
        cookieDomain,
        path: '/',
        expirationDate: lastDayOfTheYear.toUTCString(),
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

        if (DEBUG_SUBSCRIPTION_STATE_COOKIE) {
            console.log('[useSubscriptionStateCookie] Subscription data retrieved', {
                planName,
                cycle,
                userIsPaid: user.isPaid,
                hasHadSubscription,
            });
        }

        /**
         * Free users
         */
        if (!user.isPaid || !planName || !cycle) {
            const cookieValue = encodeFreeSubscriptionData({ hasHadSubscription });

            if (DEBUG_SUBSCRIPTION_STATE_COOKIE) {
                let reason = 'no cycle';
                if (!user.isPaid) {
                    reason = 'user not paid';
                } else if (!planName) {
                    reason = 'no plan name';
                }

                console.log('[useSubscriptionStateCookie] Setting cookie for free user', {
                    cookieValue,
                    hasHadSubscription,
                    reason,
                });
            }

            setSubscriptionCookie(cookieValue);

            return;
        }

        /**
         * Paid users
         */
        const cookieValue = encodePaidSubscriptionData({ planName, cycle });

        if (DEBUG_SUBSCRIPTION_STATE_COOKIE) {
            console.log('[useSubscriptionStateCookie] Setting cookie for paid user', {
                cookieValue,
                planName,
                cycle,
            });
        }

        setSubscriptionCookie(cookieValue);
    }, [user, subscription, loading, hasHadSubscription]);
};

export default useSubscriptionStateCookie;
