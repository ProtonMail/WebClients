import { useEffect, useState } from 'react';

import { paymentStatusThunk } from '@proton/account/paymentStatus';
import { plansThunk } from '@proton/account/plans';
import { subscriptionThunk } from '@proton/account/subscription';
import { userThunk } from '@proton/account/user';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import type { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useConfig from '@proton/components/hooks/useConfig';
import { getIsNewBatchCurrenciesEnabled } from '@proton/components/payments/client-extensions';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { CYCLE, PLANS, PLAN_NAMES, getPreferredCurrency } from '@proton/payments';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';
import useGetFlag from '@proton/unleash/useGetFlag';
import noop from '@proton/utils/noop';

import { getUpsellConfig } from '../../config/getUpsellConfig';
import { getMailUpsellConfig } from '../config/getUpsellModalConfig';
import type { UpsellModalConfig } from '../interface';

interface Props {
    upsellRef?: string;
    preventInApp?: boolean;
    onSubscribed?: () => void;
    step?: SUBSCRIPTION_STEPS;
}

type FetchUpsellConfig = (props: Props) => Promise<UpsellModalConfig>;

interface Props {
    upsellRef?: string;
    preventInAppPayment?: boolean;
    /** Called when user subscription is completed */
    onSubscribed?: () => void;
    step?: SUBSCRIPTION_STEPS;
}

const CONFIG_FETCH_TIMEOUT = 5000;

const useUpsellModalConfig = ({ upsellRef, preventInAppPayment, onSubscribed, step }: Props) => {
    const { APP_NAME } = useConfig();
    const [config, setConfig] = useState<UpsellModalConfig | null>(null);
    const { paymentsApi } = usePaymentsApi();
    const [openSubscriptionModal] = useSubscriptionModal();
    const dispatch = useDispatch();
    const getFlag = useGetFlag();

    useEffect(() => {
        let isConfigFetched = false;
        const controller = new AbortController();

        const fetchUpsellConfig: FetchUpsellConfig = async ({
            onSubscribed,
            preventInApp = false,
            step,
            upsellRef,
        }) => {
            // If fetch takes more than 5 seconds, abort
            // Signal can be aborted on:
            // - Component unmount
            // - Timeout
            const timeoutId = window.setTimeout(() => {
                controller.abort(`Upsell config fetch took more than limit of ${CONFIG_FETCH_TIMEOUT}ms`);
            }, CONFIG_FETCH_TIMEOUT);

            // Listen to "abort" event to throw error properly
            controller.signal.addEventListener(
                'abort',
                () => {
                    window.clearTimeout(timeoutId);
                    throw new Error(controller.signal.reason);
                },
                { once: true }
            );

            //
            // Fetch dependencies
            //
            const [user, subscription, plansModel, paymentStatus] = await Promise.all([
                dispatch(userThunk()),
                dispatch(subscriptionThunk()),
                dispatch(plansThunk()),
                dispatch(paymentStatusThunk()),
            ]);
            const plans = plansModel?.plans ?? [];

            //
            // Start logic
            //
            try {
                // Get user currency
                // - If user currency is a main currency (USD, EUR, CHF) we use plans prices
                // - If user currency is not a main currency we fetch the prices in the user currency
                const currency = getPreferredCurrency({
                    user,
                    plans,
                    paymentStatus,
                    subscription,
                    enableNewBatchCurrencies: getIsNewBatchCurrenciesEnabled(getFlag),
                });

                // Get user currency
                // - If user currency is a main currency (USD, EUR, CHF) we use plans prices
                // - If user currency is not a main currency we fetch the prices in the user currency
                const { cycle, coupon, planIDs, configOverride, footerText, submitText } = await getMailUpsellConfig({
                    dispatch,
                    currency,
                    getFlag,
                    paymentsApi,
                    plans,
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

                // Clear timeout and set fetch flag to true
                isConfigFetched = true;
                window.clearTimeout(timeoutId);

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

                const defaultConfig: UpsellModalConfig = {
                    cycle: defaultCycle,
                    planIDs: defaultPlanIDs,
                    submitText: getPlanOrAppNameText(defaultPlanName),
                    footerText: null,
                    upgradePath,
                    onUpgrade,
                };

                // Clear timeout and set fetch flag to true
                isConfigFetched = true;
                window.clearTimeout(timeoutId);

                return defaultConfig;
            }
        };

        // Execute config fetch
        void fetchUpsellConfig({
            upsellRef,
            preventInApp: preventInAppPayment,
            onSubscribed,
            step,
        })
            .then((config) => {
                setConfig(config);
            })
            .catch(noop);

        // If component is unmounted before config is fetched then abort the fetch
        return () => {
            if (!isConfigFetched) {
                controller.abort('Upsell Modal unmounted before config was fetched');
            }
        };
    }, []);

    return config;
};

export default useUpsellModalConfig;
