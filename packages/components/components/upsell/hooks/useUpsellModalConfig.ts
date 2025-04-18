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

import { getMailUpsellConfig } from '../config/getMailUpsellConfig';
import { getUpsellConfig } from '../config/getUpsellConfig';
import type { MailUpsellConfig } from '../config/interface';

interface Props {
    upsellRef?: string;
    preventInApp?: boolean;
    onSubscribed?: () => void;
    step?: SUBSCRIPTION_STEPS;
}

type FetchUpsellConfig = (props: Props) => Promise<MailUpsellConfig>;

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
    const [config, setConfig] = useState<MailUpsellConfig | null>(null);
    const { paymentsApi } = usePaymentsApi();
    const [openSubscriptionModal] = useSubscriptionModal();
    const dispatch = useDispatch();
    const getFlag = useGetFlag();

    useEffect(() => {
        const controller = new AbortController();
        const fetchUpsellConfig: FetchUpsellConfig = async ({
            onSubscribed,
            preventInApp = false,
            step,
            upsellRef,
        }) => {
            // Fetch dependencies
            const [user, subscription, plansModel, status] = await Promise.all([
                dispatch(userThunk()),
                dispatch(subscriptionThunk()),
                dispatch(plansThunk()),
                dispatch(paymentStatusThunk()),
            ]);

            try {
                const plans = plansModel?.plans ?? [];

                // Get currency
                const currency = getPreferredCurrency({
                    user,
                    plans,
                    status,
                    subscription,
                    enableNewBatchCurrencies: getIsNewBatchCurrenciesEnabled(getFlag),
                });

                const { cycle, coupon, planIDs, configOverride, footerText, submitText } = await getMailUpsellConfig({
                    dispatch,
                    currency,
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

        const fetchUpsellConfigWithTimeout = async () => {
            // If fetch takes more than 5 seconds, abort
            const timeoutId = window.setTimeout(() => {
                controller.abort(`Upsell config fetch took more than limit of ${CONFIG_FETCH_TIMEOUT}ms`);
            }, CONFIG_FETCH_TIMEOUT);

            // If signal is aborted, clear timeout and throw error
            controller.signal.addEventListener(
                'abort',
                () => {
                    window.clearTimeout(timeoutId);
                    throw new Error(controller.signal.reason);
                },
                { once: true }
            );

            const config = await fetchUpsellConfig({
                upsellRef,
                preventInApp: preventInAppPayment,
                onSubscribed,
                step,
            });

            window.clearTimeout(timeoutId);

            return config;
        };

        void fetchUpsellConfigWithTimeout()
            .then((config) => {
                setConfig(config);
            })
            .catch((e) => {
                traceInitiativeError(SentryMailInitiatives.UPSELL_MODALS, e);
            });

        return () => {
            // If component is unmounted before config is fetched, abort the fetch
            controller.abort('Upsell Modal unmounted before config was fetched');
        };
    }, []);

    return config;
};

export default useUpsellModalConfig;
