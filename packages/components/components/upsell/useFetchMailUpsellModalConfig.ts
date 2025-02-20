import { type ReactNode } from 'react';

import { paymentStatusThunk } from '@proton/account/paymentStatus';
import { plansThunk } from '@proton/account/plans';
import { subscriptionThunk } from '@proton/account/subscription';
import { userThunk } from '@proton/account/user';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import type { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useConfig from '@proton/components/hooks/useConfig';
import { useRegionalPricing } from '@proton/components/hooks/useRegionalPricing';
import type { CYCLE, PLANS } from '@proton/payments';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import useGetFlag from '@proton/unleash/useGetFlag';

import {
    getMailUpsellConfig,
    getMailUpsellsFooterText,
    getMailUpsellsSubmitText,
    getUserCurrency,
} from './useMailUpsellConfig.helpers';
import { getUpsellConfig } from './useUpsellConfig';

export interface MailUpsellConfig {
    cycle: CYCLE;
    couponCode?: string;
    footerText: ReactNode;
    submitText: ReactNode;
    planID: PLANS;
    upgradePath: string;
    onUpgrade?: () => void;
}

interface Props {
    upsellRef?: string;
    preventInApp?: boolean;
    onSubscribed?: () => void;
    step?: SUBSCRIPTION_STEPS;
}

type FetchUpsellConfig = (props: Props) => Promise<MailUpsellConfig>;

/**
 * This hook is used to fetch the upsell config for the UpsellModal.
 * @throws if no price is found
 * @returns A function used to fetch the upsell config.
 */
const useFetchMailUpsellModalConfig = () => {
    const { APP_NAME } = useConfig();
    const [openSubscriptionModal] = useSubscriptionModal();
    const dispatch = useDispatch();
    const { fetchPrice } = useRegionalPricing();
    const getFlag = useGetFlag();

    const fetchUpsellConfig: FetchUpsellConfig = async ({ onSubscribed, preventInApp = false, step, upsellRef }) => {
        // Fetch dependencies
        const [user, subscription, plansModel, status] = await Promise.all([
            dispatch(userThunk()),
            dispatch(subscriptionThunk()),
            dispatch(plansThunk()),
            dispatch(paymentStatusThunk()),
        ]);
        const plans = plansModel?.plans ?? [];

        const currency = await getUserCurrency(user, plans, status, subscription, getFlag);

        const { cycle, coupon, monthlyPrice, planID } = await getMailUpsellConfig({
            user,
            currency,
            plans,
            fetchPrice,
            upsellRef,
        });

        // Get upsell `path` and `onUpgrade` functions to display payment modal with appropriate props´´
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

        return {
            coupon,
            cycle,
            footerText: getMailUpsellsFooterText(planID, monthlyPrice, currency, coupon),
            onUpgrade,
            planID,
            submitText: getMailUpsellsSubmitText(planID, monthlyPrice, currency, coupon),
            upgradePath,
        };
    };

    return fetchUpsellConfig;
};

export default useFetchMailUpsellModalConfig;
