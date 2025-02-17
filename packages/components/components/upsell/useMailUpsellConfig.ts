import { type ReactNode, useEffect, useState } from 'react';

import { paymentStatusThunk } from '@proton/account/paymentStatus';
import { plansThunk } from '@proton/account/plans';
import { subscriptionThunk } from '@proton/account/subscription';
import { userThunk } from '@proton/account/user';
import { getUpsellConfig } from '@proton/components/components/upsell/useUpsellConfig';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import type { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useConfig from '@proton/components/hooks/useConfig';
import { useRegionalPricing } from '@proton/components/hooks/useRegionalPricing';
import { type CYCLE } from '@proton/payments';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import useGetFlag from '@proton/unleash/useGetFlag';

import {
    getMailUpsellConfig,
    getMailUpsellsFooterText,
    getMailUpsellsSubmitText,
    getPlanIDsForPlan,
    getUserCurrency,
} from './useMailUpsellConfig.helpers';

interface Props {
    upsellRef: string;
    preventInApp?: boolean;
    onSubscribed?: () => void;
    step?: SUBSCRIPTION_STEPS;
}

/**
 * This hook ensure  that we upsell the user to the right plan based on his current subscription
 * @param upsellRef reference of the upsell
 * @returns configuration of the upsell modal
 */
export const useMailUpsellConfig = ({ upsellRef, preventInApp = false, onSubscribed, step }: Props) => {
    const { APP_NAME } = useConfig();
    const [openSubscriptionModal] = useSubscriptionModal();
    const [config, setConfig] = useState<{
        cycle: CYCLE;
        couponCode?: string;
        footerText: ReactNode;
        submitText: ReactNode;
        planIDs: { [key: string]: number };
        upgradePath: string;
        onUpgrade?: () => void;
    } | null>(null);

    const dispatch = useDispatch();
    const { fetchPrice } = useRegionalPricing();
    const getFlag = useGetFlag();

    useEffect(() => {
        async function initUpsellConfig() {
            // Fetch dependencies
            const [user, subscription, plansModel, status] = await Promise.all([
                dispatch(userThunk()),
                dispatch(subscriptionThunk()),
                dispatch(plansThunk()),
                dispatch(paymentStatusThunk()),
            ]);
            const plans = plansModel?.plans ?? [];

            // Get user currency
            const currency = await getUserCurrency(user, plans, status, subscription, getFlag);

            // Based on the above infos, get the appropriate user upsell:
            // - planID: To allow upsell modal to know which plan to display at payment step
            // - coupon: Is there a promo code or not.
            // - price: Final price of the upsell
            // - cycle: Monthly or Yearly
            const {
                cycle,
                couponCode: coupon,
                price,
                planID,
            } = await getMailUpsellConfig({
                user,
                currency,
                plans,
                fetchPrice,
            });

            const { upgradePath, onUpgrade } = getUpsellConfig({
                appName: APP_NAME,
                coupon,
                cycle,
                getFlag,
                onSubscribed,
                openSubscriptionModal,
                plan: planID,
                preventInApp,
                step,
                subscription,
                upsellRef,
                user,
            });

            const config = {
                coupon,
                cycle,
                footerText: getMailUpsellsFooterText(planID, price, currency),
                onUpgrade,
                planIDs: getPlanIDsForPlan(planID),
                submitText: getMailUpsellsSubmitText(planID, price, currency),
                upgradePath,
            };

            setConfig(config);
        }

        void initUpsellConfig();
    }, []);

    return config;
};
