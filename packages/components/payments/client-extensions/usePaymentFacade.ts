import { useEffect, useRef } from 'react';

import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import useModals from '@proton/components/hooks/useModals';
import {
    type ADDON_NAMES,
    type AvailablePaymentMethod,
    type BillingAddress,
    type ChargeablePaymentParameters,
    type ChargebeeIframeEvents,
    type ChargebeeIframeHandles,
    type Currency,
    type FreeSubscription,
    PAYMENT_METHOD_TYPES,
    type PLANS,
    type PaymentMethodFlow,
    type PaymentMethodType,
    type PaymentProcessorType,
    type PaymentStatus,
    type PaymentsVersion,
    type PlainPaymentMethodType,
    type PlanIDs,
    type SavedPaymentMethod,
    type Subscription,
    type SubscriptionEstimation,
    SubscriptionMode,
} from '@proton/payments';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import type { PaymentStage } from '@proton/payments/telemetry/shared-checkout-telemetry';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { useCbIframe } from '@proton/payments/ui';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { Api, User } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';
import noop from '@proton/utils/noop';

import type { OnMethodChangedHandler, Operations, OperationsData } from '../react-extensions';
import { usePaymentFacade as useInnerPaymentFacade } from '../react-extensions';
import type { ThemeCode, ThemeLike } from './helpers';
import { getThemeCode } from './helpers';
import { wrapMethods } from './useMethods';
import { type TelemetryPaymentFlow, usePaymentsTelemetry } from './usePaymentsTelemetry';
import {
    getDefaultVerifyPayment,
    getDefaultVerifyPaypal,
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
        paymentsVersion: PaymentsVersion;
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
    isTrial?: boolean;
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

    const { createModal } = useModals();
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
            });
        }
    };

    const chargebeePaypalModalHandles = useChargebeePaypalHandles({
        onPaymentFailure: () => reportPaymentEvent('payment_declined', PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL),
        onVerificationCancelled: () =>
            reportPaymentEvent('verification_rejected_by_user', PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL),
        onVerificationSuccess: () => reportPaymentEvent('verification_success', PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL),
    });

    const isTrial = isTrialOverride ?? checkResult?.SubscriptionMode === SubscriptionMode.Trial;
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
            onChargeable: async (operations, data) => {
                try {
                    return await onChargeable(operations, data);
                } catch (error) {
                    hook.reset();
                    throw error;
                }
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
            verifyPaymentPaypal: getDefaultVerifyPaypal(createModal, api),
            verifyPayment: getDefaultVerifyPayment(createModal, api),
            verifyPaymentChargebeeCard,
            chargebeeHandles,
            chargebeeEvents,
            chargebeePaypalModalHandles,
            applePayModalHandles,
            googlePayModalHandles,
        }
    );

    const methods = wrapMethods(hook.methods, flow);

    // todo: remove it
    const userCanTrigger = {
        [PAYMENT_METHOD_TYPES.CARD]: true,
        [PAYMENT_METHOD_TYPES.CASH]: false,
        [PAYMENT_METHOD_TYPES.PAYPAL]: true,
        [PAYMENT_METHOD_TYPES.TOKEN]: false,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: true,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: true,
        [PAYMENT_METHOD_TYPES.BITCOIN]: false,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]: false,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: true,
        [PAYMENT_METHOD_TYPES.APPLE_PAY]: true,
        [PAYMENT_METHOD_TYPES.GOOGLE_PAY]: true,
    };

    const userCanTriggerSelected = methods.selectedMethod?.type ? userCanTrigger[methods.selectedMethod.type] : false;

    /**
     * The longer I looked at this construction in its previous reincarnation, the more I was puzzled about it.
     * Interestingly enough, it crystalized again during the refactoring of payments, so it might be the only
     * way to make it work.
     * This construction makes possible rendering PayPal and PayPal Credit buttons at the same time.
     * - We must pre-fetch the payment token, otherwise we won't be able to open the payment verification tab
     *     in Safari (as of 16.5, both Desktop and Mobile). The tab can be opened only as a result of
     *     synchronous handler of the click.
     * - We can't prefetch the tokens inside the Paypal and Paypal Credit buttons, because Captcha must go
     *     one after another.
     * - We can't put this overall logic into the lower levels (react-extensions or core), because it depends
     *     on the view and app-specific assumptions.
     */
    useEffect(() => {
        async function run() {
            if (hook.methods.isNewPaypal) {
                hook.paypal.reset();

                try {
                    await hook.paypal.fetchPaymentToken();
                } catch {}
            }
        }

        run().catch(noop);
    }, [hook.methods.isNewPaypal, amount, currency]);

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

        const methodsWithTaxCountry: (PaymentMethodType | undefined)[] = [
            PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
            PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
            PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
            PAYMENT_METHOD_TYPES.APPLE_PAY,
            PAYMENT_METHOD_TYPES.GOOGLE_PAY,
        ];

        const isNewMethod = methodsWithTaxCountry.includes(methods.selectedMethod?.type);

        const isSavedExternalMethod = methodsWithTaxCountry.includes(methods.savedExternalSelectedMethod?.Type);

        const migratableMethods: (PaymentMethodType | undefined)[] = [
            PAYMENT_METHOD_TYPES.CARD,
            PAYMENT_METHOD_TYPES.PAYPAL,
        ];

        const isSavedInternalMethod = migratableMethods.includes(methods.savedInternalSelectedMethod?.Type);

        const isMethodTaxCountry = isNewMethod || isSavedExternalMethod || isSavedInternalMethod;

        const flowsWithoutTaxCountry: PaymentMethodFlow[] = ['invoice', 'credit', 'add-card', 'add-paypal'];

        const showTaxCountry = isMethodTaxCountry && !flowsWithoutTaxCountry.includes(flow);
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
        userCanTrigger,
        userCanTriggerSelected,
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
    };
};

export type PaymentFacade = ReturnType<typeof usePaymentFacade>;
