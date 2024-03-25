import { useEffect, useRef } from 'react';

import { PaymentsVersion } from '@proton/shared/lib/api/payments';
import { ADDON_NAMES, APPS, PLANS } from '@proton/shared/lib/constants';
import { RequiredCheckResponse } from '@proton/shared/lib/helpers/checkout';
import { Api, ChargebeeEnabled, Currency, isTaxInclusive } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { useApi, useAuthentication, useConfig, useModals } from '../../hooks';
import { useCbIframe } from '../chargebee/ChargebeeIframe';
import {
    ChargeablePaymentParameters,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    PAYMENT_METHOD_TYPES,
    PaymentMethodFlows,
    PaymentMethodStatusExtended,
    PaymentMethodType,
    PlainPaymentMethodType,
    SavedPaymentMethod,
} from '../core';
import {
    OnMethodChangedHandler,
    Operations,
    OperationsData,
    usePaymentFacade as useInnerPaymentFacade,
} from '../react-extensions';
import { PaymentProcessorType } from '../react-extensions/interface';
import { useChargebeeEnabledCache, useChargebeeKillSwitch, useChargebeeUserStatusTracker } from './useChargebeeContext';
import { wrapMethods } from './useMethods';
import { usePaymentsTelemetry } from './usePaymentsTelemetry';
import {
    getDefaultVerifyPayment,
    getDefaultVerifyPaypal,
    useChargebeeCardVerifyPayment,
    useChargebeePaypalHandles,
} from './validators/validators';

type PaymentFacadeProps = {
    amount: number;
    currency: Currency;
    coupon?: string;
    /**
     * The flow parameter can modify the list of available payment methods and modify their behavior in certain cases.
     */
    flow: PaymentMethodFlows;
    /**
     * The main callback that will be called when the payment is ready to be charged
     * after the payment token is fetched and verified with 3DS or other confirmation from the user.
     * @param operations - provides a common set of actions that can be performed with the verified payment token.
     * For example, the verified (that is, chargeable) payment token can be used to create a subscription or buy
     * credits.
     * @param data - provides the raw payment token, the payment source (or processor type) and operation context
     * like Plan or Cycle for subscription.
     */
    onChargeable: (
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
    /**
     * The callback that will be called when the payment method is changed by the user.
     */
    onMethodChanged?: OnMethodChangedHandler;
    paymentMethods?: SavedPaymentMethod[];
    paymentMethodStatusExtended?: PaymentMethodStatusExtended;
    /**
     * Optional override for the API object. Can be helpful for auth/unauth flows.
     */
    api?: Api;
    /**
     * Optional override for the chargebeeEnabled flag. Can be helpful for auth/unauth flows.
     */
    chargebeeEnabled?: ChargebeeEnabled;
    /**
     * The selected plan will impact the displayed payment methods.
     */
    selectedPlanName?: PLANS | ADDON_NAMES;
    checkResult?: RequiredCheckResponse;
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
    onMethodChanged,
    paymentMethods,
    paymentMethodStatusExtended,
    api: apiOverride,
    selectedPlanName,
    chargebeeEnabled: chargebeeEnabledOverride,
    checkResult,
}: PaymentFacadeProps) => {
    const { APP_NAME } = useConfig();
    const defaultApi = useApi();
    const api = apiOverride ?? defaultApi;
    const { createModal } = useModals();
    const { UID } = useAuthentication();
    const isAuthenticated = !!UID;

    const iframeHandles = useCbIframe();
    const chargebeeHandles: ChargebeeIframeHandles = iframeHandles.handles;
    const chargebeeEvents: ChargebeeIframeEvents = iframeHandles.events;

    const chargebeeEnabledCache = useChargebeeEnabledCache();
    const chargebeeEnabled = chargebeeEnabledOverride ?? chargebeeEnabledCache;

    const { chargebeeKillSwitch, forceEnableChargebee } = useChargebeeKillSwitch();
    useChargebeeUserStatusTracker();

    const telemetry = usePaymentsTelemetry({
        apiOverride: api,
        plan: selectedPlanName,
        flow,
        amount,
        cycle: checkResult?.Cycle,
    });

    const { reportPaymentLoad, reportPaymentAttempt, reportPaymentFailure } = telemetry;

    const verifyPaymentChargebeeCard = useChargebeeCardVerifyPayment(api);
    const chargebeePaypalModalHandles = useChargebeePaypalHandles({
        onPaymentAttempt: reportPaymentAttempt,
        onPaymentFailure: reportPaymentFailure,
    });

    const hook = useInnerPaymentFacade(
        {
            amount,
            currency,
            coupon,
            flow,
            onMethodChanged,
            paymentMethods,
            paymentMethodStatusExtended,
            chargebeeEnabled,
            chargebeeKillSwitch,
            forceEnableChargebee,
            selectedPlanName,
            onProcessPaymentToken: reportPaymentAttempt,
            onProcessPaymentTokenFailed: (type) => {
                reportPaymentFailure(type);
            },
            onChargeable: async (operations, data) => {
                try {
                    return await onChargeable(operations, data);
                } catch (error) {
                    reportPaymentFailure(data.paymentProcessorType);
                    throw error;
                }
            },
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
        }
    );

    const methods = wrapMethods(hook.methods, flow);

    const userCanTrigger = {
        [PAYMENT_METHOD_TYPES.BITCOIN]: false,
        [PAYMENT_METHOD_TYPES.CARD]: true,
        [PAYMENT_METHOD_TYPES.CASH]: false,
        [PAYMENT_METHOD_TYPES.PAYPAL]: true,
        [PAYMENT_METHOD_TYPES.PAYPAL_CREDIT]: true,
        [PAYMENT_METHOD_TYPES.TOKEN]: false,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: true,
        [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: true,
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
                hook.paypalCredit.reset();

                try {
                    await hook.paypal.fetchPaymentToken();
                } catch {}

                // even if token fetching fails (for example because of network or Human Verification),
                // we still want to try to fetch the token for paypal-credit
                try {
                    if (APP_NAME !== APPS.PROTONVPN_SETTINGS) {
                        await hook.paypalCredit.fetchPaymentToken();
                    }
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

    const taxCountryLoading = methods.loading;
    const getShowTaxCountry = (): boolean => {
        if (taxCountryLoading) {
            return false;
        }

        const method = methods.selectedMethod?.type;
        const savedMethod = methods.savedInternalSelectedMethod;

        const methodsWithTaxCountry: (string | undefined)[] = [
            PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
            PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
        ];
        const flowsWithTaxCountry: PaymentMethodFlows[] = [
            'signup',
            'signup-pass',
            'signup-pass-upgrade',
            'signup-vpn',
            'subscription',
        ];

        const isNewAllowedMethod = methodsWithTaxCountry.includes(method);
        const isSavedAllowedMethod = !!savedMethod && methodsWithTaxCountry.includes(savedMethod.Type);

        const showTaxCountry = (isNewAllowedMethod || isSavedAllowedMethod) && flowsWithTaxCountry.includes(flow);
        return showTaxCountry;
    };

    const showInclusiveTax = getShowTaxCountry() && isTaxInclusive(checkResult);

    const helpers = {
        selectedMethodValue: methods.selectedMethod?.value,
        selectedMethodType: methods.selectedMethod?.type,
        showTaxCountry: getShowTaxCountry(),
        taxCountryLoading,
        statusExtended: methods.status,
        showInclusiveTax,
    };

    return {
        ...hook,
        ...helpers,
        methods,
        api,
        userCanTrigger,
        userCanTriggerSelected,
        iframeHandles,
        chargebeeEnabled,
        selectedPlanName,
        paymentComponentLoaded: reportPaymentLoad,
        telemetry,
    };
};
