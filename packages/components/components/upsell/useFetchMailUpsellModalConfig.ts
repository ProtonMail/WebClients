import { type ReactNode } from 'react';

import { paymentStatusThunk } from '@proton/account/paymentStatus';
import { plansThunk } from '@proton/account/plans';
import { subscriptionThunk } from '@proton/account/subscription';
import { userThunk } from '@proton/account/user';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import type { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useConfig from '@proton/components/hooks/useConfig';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { CYCLE, PLANS, PLAN_NAMES, type PlanIDs } from '@proton/payments';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import useGetFlag from '@proton/unleash/useGetFlag';

import { getMailUpsellConfig } from './useFetchMailUpsellModalConfig.helpers';
import { getUpsellConfig } from './useUpsellConfig';

export interface MailUpsellConfig {
    cycle: CYCLE;
    couponCode?: string;
    footerText: ReactNode;
    submitText: ReactNode | ((closeModal: () => void) => ReactNode);
    planIDs: PlanIDs;
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
 * @returns A function used to fetch the upsell config.
 */
const useFetchMailUpsellModalConfig = () => {
    const { APP_NAME } = useConfig();
    const { paymentsApi } = usePaymentsApi();
    const [openSubscriptionModal] = useSubscriptionModal();
    const dispatch = useDispatch();
    const getFlag = useGetFlag();

    const fetchUpsellConfig: FetchUpsellConfig = async ({ onSubscribed, preventInApp = false, step, upsellRef }) => {
        // Fetch dependencies
        const [user, subscription, plansModel, status] = await Promise.all([
            dispatch(userThunk()),
            dispatch(subscriptionThunk()),
            dispatch(plansThunk()),
            dispatch(paymentStatusThunk()),
        ]);

        try {
            const plans = plansModel?.plans ?? [];
            const { cycle, coupon, planIDs, configOverride, footerText, submitText } = await getMailUpsellConfig({
                dispatch,
                getFlag,
                paymentsApi,
                plans,
                status,
                subscription,
                upsellRef,
                user,
            });

            // Get upsell `path` and `onUpgrade` functions to display payment modal with appropriate props´´
            const { upgradePath, onUpgrade } = getUpsellConfig({
                appName: APP_NAME,
                coupon,
                configOverride,
                cycle,
                getFlag,
                onSubscribed,
                openSubscriptionModal,
                planIDs,
                preventInApp,
                step,
                subscription,
                upsellRef,
                user,
            });

            return {
                coupon,
                cycle,
                footerText,
                onUpgrade,
                planIDs,
                submitText,
                upgradePath,
            };
        } catch (error) {
            traceInitiativeError(SentryMailInitiatives.UPSELL_MODALS, error);

            // Return default config to Unlimited
            // no pricing mentioned in the upsell texts
            // to prevent prices fetch errors
            const defaultCycle = CYCLE.YEARLY;
            const defaultPlanIDs = { [PLANS.BUNDLE]: 1 };
            const defaultPlanName = PLAN_NAMES[PLANS.BUNDLE];

            const { upgradePath, onUpgrade } = getUpsellConfig({
                appName: APP_NAME,
                cycle: defaultCycle,
                getFlag,
                onSubscribed,
                openSubscriptionModal,
                planIDs: defaultPlanIDs,
                preventInApp,
                step,
                subscription,
                upsellRef,
                user,
            });

            const defaultConfig: MailUpsellConfig = {
                cycle: defaultCycle,
                planIDs: defaultPlanIDs,
                submitText: getPlanOrAppNameText(defaultPlanName),
                footerText: '',
                upgradePath,
                onUpgrade,
            };

            return defaultConfig;
        }
    };

    return fetchUpsellConfig;
};

export default useFetchMailUpsellModalConfig;
