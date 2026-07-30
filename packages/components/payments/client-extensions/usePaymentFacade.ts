import { useEffect, useRef } from 'react';

import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import useLoading from '@proton/hooks/useLoading';
import type { BillingAddress } from '@proton/payments/core/billing-address/billing-address';
import { type ADDON_NAMES, PAYMENT_METHOD_TYPES, type PLANS } from '@proton/payments/core/constants';
import type {
    AvailablePaymentMethod,
    ChargeablePaymentParameters,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    Currency,
    FreeSubscription,
    PaymentMethodFlow,
    PaymentMethodType,
    PaymentStatus,
    PlainPaymentMethodType,
    PlanIDs,
    SavedPaymentMethod,
} from '@proton/payments/core/interface';
import type { PaymentProcessorType } from '@proton/payments/core/payment-processors/interface';
import { SubscriptionMode } from '@proton/payments/core/subscription/constants';
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import type { PaymentStage } from '@proton/payments/telemetry/shared-checkout-telemetry';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { useCbIframe } from '@proton/payments/ui/components/ChargebeeIframe';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { Api, User } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import type { OnMethodChangedHandler, Operations, OperationsData } from '../react-extensions';
import { usePaymentFacade as useInnerPaymentFacade } from '../react-extensions';
import type { ThemeCode, ThemeLike } from './helpers';
import { getThemeCode } from './helpers';
import { wrapMethods } from './useMethods';
import { type TelemetryPaymentFlow, usePaymentsTelemetry } from './usePaymentsTelemetry';
import {
    useApplePayDependencies,
    useChargebeeCardVerifyPayment,
    useChargebeePaypalHandles,
    useGooglePayDependencies,
} from './validators/validators';

/**
 * The main callback that will be called when the payment is ready to be charged
 * after the payment token is fetched and verified with 3DS or other confirmation from the user.
 * @param operations - provides a common set of actions that can be performed with the verified payment token.
 * For example, the verified (that is, chargeable) payment token can be used to create a subscription or buy
 * credits.
 * @param data - provides the raw payment token, the payment source (or processor type) and operation context
 * like Plan or Cycle for subscription.
 */
export type OnChargeable = (
    operations: Operations,
    data: {
        chargeablePaymentParameters: ChargeablePaymentParameters;
        source: PaymentMethodType;
        sourceType: PlainPaymentMethodType;
        context: OperationsData;
        paymentProcessorType: PaymentProcessorType;
    }
) => Promise<unknown>;

type PaymentFacadeProps = {
    amount: number;
    currency: Currency;
    coupon?: string;
    /**
     * The flow parameter can modify the list of available payment methods and modify their behavior in certain cases.
     */
    flow: PaymentMethodFlow;
    telemetryFlow?: TelemetryPaymentFlow;
    /**
     * The main callback that will be called when the payment is ready to be charged
     * after the payment token is fetched and verified with 3DS or other confirmation from the user.
     */
    onChargeable: OnChargeable;
    /**
     * The callback that will be called when the payment method is changed by the user.
     */
    onMethodChanged?: OnMethodChangedHandler;
    paymentMethods?: SavedPaymentMethod[];
    paymentStatus?: PaymentStatus;
    /**
     * Optional override for the API object. Can be helpful for auth/unauth flows.
     */
    api?: Api;
    /**
     * The selected plan will impact the displayed payment methods.
     */
    selectedPlanName?: PLANS | ADDON_NAMES;
    checkResult?: SubscriptionEstimation;
    theme?: ThemeLike;
    billingAddress?: BillingAddress;
    user?: User;
    subscription?: Subscription | FreeSubscription;
    onBeforeSepaPayment?: () => Promise<boolean>;
    planIDs?: PlanIDs;
    /** Overrides trial detection for payment behavior. */
    isTrial?: boolean;
    /** The user's intention to start a trial, for telemetry only. Defaults to isTrial, then false. */
    isTrialIntended?: boolean;
    product: ProductParam;
    telemetryContext: PaymentTelemetryContext;
    sortNewMethods?: (methods: AvailablePaymentMethod[]) => AvailablePaymentMethod[];
};

/**
 * Entry point for the payment logic for the monorepo clients. It's a wrapper around the
 * react-specific facade. The main purpose of this wrapper is to provide the default
 * implementation for the client-specific logic. It includes the implementation of the
 * token verification that depends on the view, as it requires user action. It also includes
 * pre-fetching of the payment tokens for PayPal and PayPal Credit. In addition, the payment
 * methods objects are enriched with the icons and texts.
 */
export const usePaymentFacade = ({
    amount,
    currency,
    onChargeable,
    coupon,
    flow,
    telemetryFlow,
    onMethodChanged,
    paymentMethods,
    paymentStatus,
    api: apiOverride,
    selectedPlanName,
    checkResult,
    theme,
    billingAddress,
    user,
    subscription,
    onBeforeSepaPayment,
    planIDs,
    isTrial: isTrialOverride,
    isTrialIntended: isTrialIntendedOverride,
    product,
    telemetryContext,
    sortNewMethods,
}: PaymentFacadeProps) => {
    const { APP_NAME } = useConfig();

    const enableSepa = useFlag('SepaPayments');
    const enableSepaB2C = useFlag('SepaPaymentsB2C');
    const enablePaypalRegionalCurrenciesBatch3 = useFlag('PaypalRegionalCurrenciesBatch3');
    const enablePaypalKrw = useFlag('PaypalKrw');

    const defaultApi = useApi();
    const api = apiOverride ?? defaultApi;

    const themeCode: ThemeCode = getThemeCode(theme);

    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;

    const iframeHandles = useCbIframe();
    const chargebeeHandles: ChargebeeIframeHandles = iframeHandles.handles;
    const chargebeeEvents: ChargebeeIframeEvents = iframeHandles.events;

    const telemetry = usePaymentsTelemetry({
        apiOverride: api,
        plan: selectedPlanName,
        flow: telemetryFlow ?? flow,
        amount,
        cycle: checkResult?.Cycle,
    });

    const { reportPaymentLoad } = telemetry;

    // Drives payment behavior: whether the actual transaction is a trial, per the estimation.
    const isTrial = isTrialOverride ?? checkResult?.SubscriptionMode === SubscriptionMode.Trial;
    // For telemetry: the user's intention to start a trial, not a lagging indicator derived from the estimation.
    const isTrialIntended = isTrialIntendedOverride ?? isTrialOverride ?? false;

    const verifyPaymentChargebeeCard = useChargebeeCardVerifyPayment(api, {
        checkResult,
        user,
        subscription,
        product,
        telemetryContext,
    });

    const reportPaymentEvent = (
        stage: PaymentStage,
        paymentMethodType: PlainPaymentMethodType,
        paymentMethodValueParam?: PaymentMethodType
    ) => {
        if (checkResult) {
            checkoutTelemetry.reportPayment({
                stage,
                userCurrency: user?.Currency,
                subscription,
                amount: checkResult.AmountDue,
                paymentMethodType,
                paymentMethodValue: paymentMethodValueParam ?? paymentMethodType,
                selectedCurrency: checkResult.Currency,
                selectedPlanIDs: checkResult.requestData.Plans,
                selectedCycle: checkResult.Cycle,
                selectedCoupon: checkResult.Coupon?.Code,
                build: APP_NAME,
                product,
                context: telemetryContext,
                isTrial: isTrialIntended,
            });
        }
    };

    const chargebeePaypalModalHandles = useChargebeePaypalHandles({
        onPaymentFailure: () => reportPaymentEvent('payment_declined', PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL),
        onVerificationCancelled: () =>
            reportPaymentEvent('verification_rejected_by_user', PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL),
        onVerificationSuccess: () => reportPaymentEvent('verification_success', PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL),
    });

    const { canUseApplePay, applePayModalHandles } = useApplePayDependencies(chargebeeHandles, {
        onPaymentFailure: () => reportPaymentEvent('payment_declined', PAYMENT_METHOD_TYPES.APPLE_PAY),
        onVerificationCancelled: () =>
            reportPaymentEvent('verification_rejected_by_user', PAYMENT_METHOD_TYPES.APPLE_PAY),
        onVerificationSuccess: () => reportPaymentEvent('verification_success', PAYMENT_METHOD_TYPES.APPLE_PAY),
    });

    const { canUseGooglePay, googlePayModalHandles } = useGooglePayDependencies(chargebeeHandles, {
        onPaymentFailure: () => reportPaymentEvent('payment_declined', PAYMENT_METHOD_TYPES.GOOGLE_PAY),
        onVerificationCancelled: () =>
            reportPaymentEvent('verification_rejected_by_user', PAYMENT_METHOD_TYPES.GOOGLE_PAY),
        onVerificationSuccess: () => reportPaymentEvent('verification_success', PAYMENT_METHOD_TYPES.GOOGLE_PAY),
    });

    const [processingPayment, withProcessingPayment] = useLoading();
    const hook = useInnerPaymentFacade(
        {
            amount,
            currency,
            coupon,
            flow,
            onMethodChanged,
            paymentMethods,
            paymentStatus,
            selectedPlanName,
            billingAddress,
            onChargeable: (operations, data) => {
                const processPayment = async () => {
                    try {
                        return await onChargeable(operations, data);
                    } catch (error) {
                        hook.reset();
                        throw error;
                    }
                };

                const promise = processPayment();
                void withProcessingPayment(promise);
                return promise;
            },
            user,
            subscription,
            enableSepa,
            enableSepaB2C,
            onBeforeSepaPayment,
            planIDs,
            isTrial,
            canUseApplePay,
            canUseGooglePay,
            enablePaypalRegionalCurrenciesBatch3,
            enablePaypalKrw,
            telemetryContext,
            onDeclined: ({ selectedMethodType, selectedMethodValue }) =>
                reportPaymentEvent('payment_declined', selectedMethodType, selectedMethodValue),
            onValidationFailed: ({ selectedMethodType, selectedMethodValue }) =>
                reportPaymentEvent('attempt_declined_invalid_data', selectedMethodType, selectedMethodValue),
            sortNewMethods,
        },
        {
            api,
            isAuthenticated,
            verifyPaymentChargebeeCard,
            chargebeeHandles,
            chargebeeEvents,
            chargebeePaypalModalHandles,
            applePayModalHandles,
            googlePayModalHandles,
        }
    );

    const methods = wrapMethods(hook.methods, flow);

    const paypalAbortRef = useRef<AbortController | null>(null);
    useEffect(() => {
        const abort = () => {
            paypalAbortRef.current?.abort();
            paypalAbortRef.current = null;
        };

        async function run() {
            if (hook.methods.selectedMethod?.type !== PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
                return;
            }

            paypalAbortRef.current = new AbortController();

            hook.chargebeePaypal.reset();
            try {
                await hook.chargebeePaypal.initialize(paypalAbortRef.current.signal);
            } catch {
                abort();
            }
        }

        void run();

        return abort;
    }, [hook.methods.selectedMethod?.type, amount, currency]);

    const applePayAbortRef = useRef<AbortController | null>(null);
    useEffect(() => {
        const abort = () => {
            applePayAbortRef.current?.abort();
            applePayAbortRef.current = null;
        };

        async function run() {
            if (!hook.methods.isNewApplePay) {
                return;
            }

            applePayAbortRef.current = new AbortController();
            hook.applePay.reset();

            try {
                await hook.applePay.initialize(applePayAbortRef.current.signal);
            } catch {
                abort();
            }
        }

        void run();

        return abort;
    }, [hook.methods.isNewApplePay, amount, currency]);

    const googlePayAbortRef = useRef<AbortController | null>(null);
    useEffect(() => {
        const abort = () => {
            googlePayAbortRef.current?.abort();
            googlePayAbortRef.current = null;
        };

        async function run() {
            if (!hook.methods.isNewGooglePay) {
                return;
            }

            googlePayAbortRef.current = new AbortController();
            hook.googlePay.reset();

            try {
                await hook.googlePay.initialize(googlePayAbortRef.current.signal);
            } catch {
                abort();
            }
        }

        void run();

        return abort;
    }, [hook.methods.isNewGooglePay, amount, currency]);

    const taxCountryLoading = methods.loading;
    const getShowTaxCountry = (): boolean => {
        if (taxCountryLoading) {
            return false;
        }

        const flowsWithoutTaxCountry: PaymentMethodFlow[] = ['invoice', 'credit', 'add-card', 'add-paypal'];

        const showTaxCountry = !flowsWithoutTaxCountry.includes(flow);
        return showTaxCountry;
    };

    const helpers = {
        selectedMethodValue: methods.selectedMethod?.value,
        selectedMethodType: methods.selectedMethod?.type,
        showTaxCountry: getShowTaxCountry(),
        taxCountryLoading,
        paymentStatus: methods.status,
    };

    return {
        ...hook,
        ...helpers,
        methods,
        api,
        iframeHandles,
        selectedPlanName,
        paymentComponentLoaded: reportPaymentLoad,
        telemetry,
        themeCode,
        user,
        checkResult,
        subscription,
        telemetryContext,
        product,
        processingPayment,
        isTrialIntended,
    };
};

export type PaymentFacade = ReturnType<typeof usePaymentFacade>;
