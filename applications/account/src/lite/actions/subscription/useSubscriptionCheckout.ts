import { c } from 'ttag';

import { useAppName } from '@proton/account/appName';
import { useUser } from '@proton/account/user/hooks';
import { useGetCalendars } from '@proton/calendar/calendars/hooks';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import { changeDefaultPaymentMethodBeforePayment } from '@proton/components/containers/payments/DefaultPaymentMethodMessage';
import { useCancelSubscriptionFlow } from '@proton/components/containers/payments/subscription/cancelSubscription/useCancelSubscriptionFlow';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { useAvailableCurrenciesForPlan } from '@proton/components/containers/payments/subscription/modal-components/SubscriptionCheckout';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { sortMethodsBasedOnDevice } from '@proton/components/payments/client-extensions';
import { usePaymentFacade } from '@proton/components/payments/client-extensions/usePaymentFacade';
import { usePollEvents } from '@proton/components/payments/client-extensions/usePollEvents';
import type {
    Operations,
    OperationsSubscriptionData,
} from '@proton/components/payments/react-extensions/usePaymentFacade';
import useLoading from '@proton/hooks/useLoading';
import Metrics, { observeApiError } from '@proton/metrics/index';
import { ProrationMode } from '@proton/payments/core/api/api';
import { FREE_SUBSCRIPTION, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PaymentMethodType } from '@proton/payments/core/interface';
import type { PaymentProcessorType } from '@proton/payments/core/payment-processors/interface';
import { isLifetimePlanSelected } from '@proton/payments/core/plan/helpers';
import { hasPlanIDs } from '@proton/payments/core/planIDs';
import { SubscriptionMode } from '@proton/payments/core/subscription/constants';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import { getShouldCalendarPreventSubscripitionChange } from '@proton/shared/lib/calendar/plans';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import noop from '@proton/utils/noop';

import { getCodesForSubscription } from './helpers';
import type {
    SubscriptionCheckoutMetricsOverrides,
    SubscriptionCheckoutMetricsStep,
    SubscriptionCheckoutMetricsUpgradeFromPlan,
} from './interface';

type SubscriptionContext = {
    operationsSubscriptionData: OperationsSubscriptionData;
    paymentProcessorType: PaymentProcessorType;
    paymentMethodValue: PaymentMethodType;
};

function getMetricsAppName(appName: APP_NAMES) {
    switch (appName) {
        case APPS.PROTONVPN_SETTINGS:
            return APPS.PROTONVPN_SETTINGS;
        case APPS.PROTONACCOUNTLITE:
            return APPS.PROTONACCOUNTLITE;
        default:
            return APPS.PROTONACCOUNT;
    }
}

interface Props {
    onStepChange: (step: SUBSCRIPTION_STEPS) => void;
    onSubscribed: () => void;
    onUnsubscribed: () => void;
    metrics: SubscriptionCheckoutMetricsOverrides;
}

const useSubscriptionCheckout = ({ onStepChange, onSubscribed, onUnsubscribed, metrics }: Props) => {
    const { APP_NAME } = useConfig();
    const appName = useAppName();
    const [user] = useUser();
    const getCalendars = useGetCalendars();

    const {
        checkoutUi,
        checkResult,
        paymentStatus,
        billingAddress,
        vatNumber,
        subscription,
        loading,
        plansMap,
        plans,
        telemetryContext,
        coupon,
        reRunPaymentChecks,
    } = usePayments();
    const { planName, planIDs, cycle, currency } = checkoutUi;
    const [subscribing, withSubscribing] = useLoading();
    const api = useApi();
    const pollEventsMultipleTimes = usePollEvents();
    const app = useAppName();
    const { createNotification } = useNotifications();
    const { cancelSubscriptionModals, cancelSubscription } = useCancelSubscriptionFlow({ app });
    const [calendarDowngradeModal, showCalendarDowngradeModal] = useModalTwoPromise();
    const eventManager = useEventManager();

    const availableCurrencies = useAvailableCurrenciesForPlan(plansMap[planName], subscription ?? FREE_SUBSCRIPTION);

    const handleSubscribe = async (
        operations: Operations,
        { operationsSubscriptionData, paymentMethodValue }: SubscriptionContext
    ) => {
        if (!hasPlanIDs(operationsSubscriptionData.Plans)) {
            const result = await cancelSubscription({});
            if (result?.status === 'kept') {
                return;
            }
            onUnsubscribed?.();
            return;
        }

        const shouldCalendarPreventSubscriptionChangePromise = getShouldCalendarPreventSubscripitionChange({
            user,
            api,
            getCalendars,
            newPlan: operationsSubscriptionData.Plans,
            plans,
        });

        if (await shouldCalendarPreventSubscriptionChangePromise) {
            return showCalendarDowngradeModal();
        }

        const metricsProps = {
            ...metrics,
            step: 'checkout' as SubscriptionCheckoutMetricsStep,
            fromPlan: isFreeSubscription(subscription)
                ? 'free'
                : ('paid' as SubscriptionCheckoutMetricsUpgradeFromPlan),
            application: getMetricsAppName(APP_NAME),
        };

        try {
            eventManager.stop();
            onStepChange(SUBSCRIPTION_STEPS.UPGRADE);
            try {
                await changeDefaultPaymentMethodBeforePayment(
                    api,
                    paymentMethodValue,
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    paymentFacade.methods.savedMethods ?? []
                );

                const codes = getCodesForSubscription(checkResult?.Gift ? coupon : '', checkResult?.Coupon?.Code);
                await operations.subscribe({
                    Codes: codes,
                    Plans: planIDs,
                    Cycle: cycle,
                    product: app,
                    taxBillingAddress: billingAddress,
                    StartTrial: checkResult?.SubscriptionMode === SubscriptionMode.Trial,

                    vatNumber: vatNumber,
                });
            } catch (error) {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                paymentFacade.reset();

                throw error;
            }
            await eventManager.call();

            void Metrics.payments_subscription_total.increment({
                ...metricsProps,
                status: 'success',
            });
            onSubscribed();
        } catch (error: any) {
            const { Code = 0 } = error.data || {};

            if (Code === API_CUSTOM_ERROR_CODES.PAYMENTS_SUBSCRIPTION_AMOUNT_MISMATCH) {
                // translator: this message pops in a notification, in case user is waiting really too long, or does the checkout in another tab, which makes this ones not valid/expiring
                createNotification({ text: c('Error').t`Checkout expired, please try again`, type: 'error' });
            }

            observeApiError(error, (status) =>
                Metrics.payments_subscription_total.increment({
                    ...metricsProps,
                    status,
                })
            );

            onStepChange(SUBSCRIPTION_STEPS.CHECKOUT);
            throw error;
        } finally {
            eventManager.start();
        }
    };

    const paymentFacade = usePaymentFacade({
        checkResult,
        amount: checkResult?.AmountDue || 0,
        currency,
        selectedPlanName: planName,
        billingAddress,
        paymentStatus,
        onChargeable: async (operations, { paymentProcessorType, source }) => {
            const context: SubscriptionContext = {
                operationsSubscriptionData: {
                    Plans: planIDs,
                    Cycle: cycle,
                    product: appName,
                    Codes: getCodesForSubscription(coupon, checkResult?.Coupon?.Code),
                    taxBillingAddress: billingAddress,
                    StartTrial: checkResult?.SubscriptionMode === SubscriptionMode.Trial,
                    vatNumber: vatNumber,
                },
                paymentProcessorType,
                paymentMethodValue: source,
            };

            const promise = withSubscribing(handleSubscribe(operations, context));

            promise.then(() => pollEventsMultipleTimes()).catch(noop);

            return promise.catch(noop);
        },
        flow: 'subscription',
        product: appName,
        telemetryContext,
        user,
        subscription,
        planIDs: planIDs,
        coupon: checkResult?.Coupon?.Code,
        onBeforeSepaPayment: async () => {
            if (checkResult.ProrationMode === ProrationMode.Exact) {
                const currentAmountDue = checkResult.AmountDue;

                const newCheckResult = await reRunPaymentChecks();
                if (newCheckResult?.AmountDue !== currentAmountDue) {
                    createNotification({
                        text: c('Error').t`The amount due has changed. Please try again.`,
                        type: 'warning',
                        expiration: -1,
                    });
                    return false;
                }
            }

            return true;
        },
        sortNewMethods: sortMethodsBasedOnDevice,
    });

    const isSepaDirectDebit =
        paymentFacade.methods.selectedMethod?.type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT;
    const isLifetimeWithCredits = user.Credit > 0 && isLifetimePlanSelected(planIDs);

    const disableCurrencySelector = isSepaDirectDebit || isLifetimeWithCredits || loading;

    return {
        paymentFacade,
        subscribing,
        cancelSubscriptionModals,
        shouldDisableCurrencySelection: disableCurrencySelector,
        availableCurrencies,
        calendarDowngradeModal,
    };
};

export default useSubscriptionCheckout;
