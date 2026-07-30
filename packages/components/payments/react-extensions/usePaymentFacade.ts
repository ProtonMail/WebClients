import { useMemo, useRef } from 'react';

import useConfig from '@proton/components/hooks/useConfig';
import { type PaymentsVersion, buyCredit, payInvoice, setPaymentMethodV5 } from '@proton/payments/core/api/api';
import { createPaymentSubscription } from '@proton/payments/core/api/createPaymentSubscription';
import type { BillingAddress } from '@proton/payments/core/billing-address/billing-address';
import { type ADDON_NAMES, PAYMENT_METHOD_TYPES, type PLANS } from '@proton/payments/core/constants';
import type { PaymentVerificatorV5 } from '@proton/payments/core/createPaymentToken';
import type {
    AmountAndCurrency,
    AvailablePaymentMethod,
    ChargeablePaymentParameters,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    Currency,
    Cycle,
    FreeSubscription,
    PaymentMethodFlow,
    PaymentMethodType,
    PaymentStatus,
    PlainPaymentMethodType,
    PlanIDs,
    SavedPaymentMethod,
} from '@proton/payments/core/interface';
import { useSepaCurrencyOverride } from '@proton/payments/core/payment-methods/useSepaCurrencyOverride';
import type { ChargebeePaypalModalHandles } from '@proton/payments/core/payment-processors/chargebeePaypalPayment';
import type { PaymentProcessorType } from '@proton/payments/core/payment-processors/interface';
import { type ApplePayModalHandles, useApplePay } from '@proton/payments/core/payment-processors/useApplePay';
import { type GooglePayModalHandles, useGooglePay } from '@proton/payments/core/payment-processors/useGooglePay';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { isExistingPaymentMethod } from '@proton/payments/core/type-guards';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Api, User } from '@proton/shared/lib/interfaces';

import useBitcoin from './useBitcoin';
import { useChargebeeCard } from './useChargebeeCard';
import { useChargebeePaypal } from './useChargebeePaypal';
import type { OnMethodChangedHandler } from './useMethods';
import { useMethods } from './useMethods';
import { usePaymentsApi } from './usePaymentsApi';
import { useSavedChargebeeMethod } from './useSavedChargebeeMethod';
import { useSepaDirectDebit } from './useSepaDirectDebit';

export interface OperationsSubscriptionData {
    Plans: PlanIDs;
    Cycle: Cycle;
    Codes?: string[];
    product: ProductParam;
    taxBillingAddress: BillingAddress;
    StartTrial?: boolean;
    vatNumber?: string;
}

interface OperationsInvoiceData {
    invoiceId: string;
}

export interface OperationsData {
    subscription?: OperationsSubscriptionData;
    invoice?: OperationsInvoiceData;
}

/**
 * Common operations that can be performed with a chargeable payment token. The operations are ment to be available in
 * onChargeable callback.
 */
export interface Operations {
    buyCredit: () => Promise<unknown>;
    payInvoice: (invoiceId: string, paymentsVersion: PaymentsVersion) => Promise<unknown>;
    subscribe: (operationsDataParam?: OperationsSubscriptionData) => Promise<unknown>;
    savePaymentMethod: () => Promise<unknown>;
}

function getOperations(
    api: Api,
    params: ChargeablePaymentParameters,
    operationsData: OperationsData,
    {
        afterOperation,
        paymentMethodValue,
        userCurrency,
        subscription,
        build,
        telemetryContext,
    }: {
        afterOperation?: () => void;
        paymentMethodValue: PaymentMethodType;
        userCurrency: Currency | undefined;
        subscription: Subscription | FreeSubscription | undefined;
        build: APP_NAMES;
        telemetryContext: PaymentTelemetryContext;
    }
): Operations {
    const wrappedAfterOperation = <T>(result: T) => {
        afterOperation?.();
        return result;
    };

    return {
        buyCredit: async () => {
            return api(buyCredit(params)).then(wrappedAfterOperation);
        },
        payInvoice: async (invoiceId: string, version: PaymentsVersion) => {
            return api(payInvoice(invoiceId, params, version)).then(wrappedAfterOperation);
        },
        subscribe: async (operationsDataParam?: OperationsSubscriptionData) => {
            if (!operationsData?.subscription && !operationsDataParam) {
                throw new Error('The operations data for subscription must be provided in the facade');
            }

            const { product, taxBillingAddress, vatNumber, ...data } = (operationsData.subscription ??
                operationsDataParam) as OperationsSubscriptionData;

            const BillingAddress: BillingAddress = {
                State: taxBillingAddress.State,
                CountryCode: taxBillingAddress.CountryCode,
                ZipCode: taxBillingAddress.ZipCode,
            };

            return createPaymentSubscription(
                api,
                {
                    PaymentToken: params.PaymentToken,
                    BillingAddress,
                    VatId: vatNumber,
                    ...params,
                    ...data,
                },
                {
                    product,
                    paymentMethodType: params.type,
                    paymentMethodValue,
                    userCurrency,
                    subscription,
                    build,
                    telemetryContext,
                }
            ).then(wrappedAfterOperation);
        },
        savePaymentMethod: async () => {
            const PaymentToken = params.PaymentToken;
            if (!PaymentToken) {
                throw new Error('Could not save payment method without a payment token');
            }

            return api(
                setPaymentMethodV5({
                    PaymentToken,
                    v: 5,
                })
            );
        },
    };
}

/**
 * Stores the data for operations. That's meant to bypass React's rendering cycle.
 * Perhaps will be changed in the future.
 */
const usePaymentContext = () => {
    const subscriptionData = useRef<OperationsSubscriptionData>();

    return {
        setSubscriptionData: (data: OperationsSubscriptionData | undefined) => {
            subscriptionData.current = data;
        },
        getSubscriptionData: () => {
            return subscriptionData.current;
        },
        getOperationsData: (): OperationsData => {
            return {
                subscription: subscriptionData.current,
            };
        },
    };
};

/**
 * The idea of this hook is gather together all the payment methods and their implementation and provide some
 * meaningful default configurations. This facade might be reused in other apps (like static) in the future.
 * The implementation attempts to avoid dependencies on the monorepo's client-specific code. There are still some
 * leftovers that might be removed later.
 */
export const usePaymentFacade = (
    {
        amount,
        currency,
        onChargeable,
        coupon,
        flow,
        onMethodChanged,
        paymentMethods,
        paymentStatus,
        selectedPlanName,
        billingAddress,
        user,
        enableSepa,
        enableSepaB2C,
        onBeforeSepaPayment,
        planIDs,
        subscription,
        isTrial,
        canUseApplePay,
        canUseGooglePay,
        enablePaypalRegionalCurrenciesBatch3,
        enablePaypalKrw,
        onDeclined,
        onValidationFailed,
        telemetryContext,
        sortNewMethods,
    }: {
        amount: number;
        currency: Currency;
        onChargeable: (
            operations: Operations,
            data: {
                chargeablePaymentParameters: ChargeablePaymentParameters;
                source: PaymentMethodType;
                sourceType: PlainPaymentMethodType;
                context: OperationsData;
                paymentProcessorType: PaymentProcessorType;
            }
        ) => Promise<unknown>;
        coupon?: string;
        flow: PaymentMethodFlow;
        onMethodChanged?: OnMethodChangedHandler;
        paymentMethods?: SavedPaymentMethod[];
        paymentStatus?: PaymentStatus;
        selectedPlanName: PLANS | ADDON_NAMES | undefined;
        billingAddress?: BillingAddress;
        user: User | undefined;
        enableSepa?: boolean;
        enableSepaB2C?: boolean;
        onBeforeSepaPayment?: () => Promise<boolean>;
        planIDs?: PlanIDs;
        subscription?: Subscription | FreeSubscription;
        isTrial?: boolean;
        canUseApplePay?: boolean;
        canUseGooglePay?: boolean;
        enablePaypalRegionalCurrenciesBatch3: boolean;
        enablePaypalKrw: boolean;
        telemetryContext: PaymentTelemetryContext;
        onDeclined: ({
            selectedMethodType,
            selectedMethodValue,
        }: {
            selectedMethodType: PlainPaymentMethodType;
            selectedMethodValue: PaymentMethodType;
        }) => void;
        onValidationFailed: ({
            selectedMethodType,
            selectedMethodValue,
        }: {
            selectedMethodType: PlainPaymentMethodType;
            selectedMethodValue: PaymentMethodType;
        }) => void;
        sortNewMethods?: (methods: AvailablePaymentMethod[]) => AvailablePaymentMethod[];
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
    }: {
        api: Api;
        isAuthenticated: boolean;
        verifyPaymentChargebeeCard: PaymentVerificatorV5;
        chargebeeHandles: ChargebeeIframeHandles;
        chargebeeEvents: ChargebeeIframeEvents;
        chargebeePaypalModalHandles?: ChargebeePaypalModalHandles;
        applePayModalHandles?: ApplePayModalHandles;
        googlePayModalHandles?: GooglePayModalHandles;
    }
) => {
    const { APP_NAME } = useConfig();

    const amountAndCurrency: AmountAndCurrency = useMemo(
        () => ({
            Amount: amount,
            Currency: currency,
        }),
        [amount, currency]
    );

    const paymentContext = usePaymentContext();
    const { paymentsApi } = usePaymentsApi(api);

    const methods = useMethods(
        {
            amount,
            currency,
            coupon: coupon ?? '',
            flow,
            onMethodChanged,
            paymentMethods,
            paymentStatus,
            paymentsApi,
            selectedPlanName,
            billingAddress,
            enableSepa,
            enableSepaB2C,
            user,
            planIDs,
            subscription,
            canUseApplePay,
            canUseGooglePay,
            isTrial,
            enablePaypalRegionalCurrenciesBatch3,
            enablePaypalKrw,
            sortNewMethods,
        },
        {
            api,
            isAuthenticated,
        }
    );

    const operationProps = {
        userCurrency: user?.Currency,
        subscription,
        build: APP_NAME,
        telemetryContext,
    };

    const savedChargebeeMethod = useSavedChargebeeMethod(
        {
            amountAndCurrency,
            savedMethod: methods.savedSelectedMethod,
            onBeforeSepaPayment,
            onChargeable: (params, paymentMethodId) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), {
                        paymentMethodValue: paymentMethodId,
                        ...operationProps,
                    }),
                    {
                        chargeablePaymentParameters: params,
                        source: paymentMethodId,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),

                        paymentProcessorType: savedChargebeeMethod.meta.type,
                    }
                ),
            onDeclined,
        },
        {
            api,
            verifyPayment: verifyPaymentChargebeeCard,
            handles: chargebeeHandles,
            events: chargebeeEvents,
        }
    );

    const chargebeeCard = useChargebeeCard(
        {
            amountAndCurrency,
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), {
                        paymentMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                        ...operationProps,
                    }),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),

                        paymentProcessorType: chargebeeCard.meta.type,
                    }
                ),
            verifyOnly: flow === 'add-card' || isTrial,
            paymentStatus,
            onDeclined,
            onValidationFailed,
        },
        {
            api,
            verifyPayment: verifyPaymentChargebeeCard,
            handles: chargebeeHandles,
            events: chargebeeEvents,
        }
    );

    const chargebeePaypal = useChargebeePaypal(
        {
            amountAndCurrency,
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), {
                        paymentMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                        ...operationProps,
                    }),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),

                        paymentProcessorType: chargebeePaypal.meta.type,
                    }
                ),
        },
        {
            api,
            verifyPayment: verifyPaymentChargebeeCard,
            handles: chargebeeHandles,
            events: chargebeeEvents,
            chargebeePaypalModalHandles,
        }
    );

    const paymentMethodValue: PaymentMethodType | undefined = methods.selectedMethod?.value;
    const bitcoinChargebee = useBitcoin({
        api,
        Amount: amount,
        Currency: currency,
        enablePolling: paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
        billingAddress,
        onTokenValidated: (params: ChargeablePaymentParameters) => {
            return onChargeable(
                getOperations(api, params, paymentContext.getOperationsData(), {
                    paymentMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
                    ...operationProps,
                }),
                {
                    chargeablePaymentParameters: params,
                    source: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
                    sourceType: params.type,
                    context: paymentContext.getOperationsData(),

                    paymentProcessorType: bitcoinChargebee.meta.type,
                }
            );
        },
    });

    const directDebit = useSepaDirectDebit(
        {
            amountAndCurrency,
            selectedPlanName,
            onBeforeSepaPayment,
            onChargeable: (params) => {
                return onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), {
                        paymentMethodValue: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                        ...operationProps,
                    }),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),

                        paymentProcessorType: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    }
                );
            },
            onValidationFailed,
        },
        {
            api,
            handles: chargebeeHandles,
            events: chargebeeEvents,
            verifyPayment: verifyPaymentChargebeeCard,
        }
    );

    const applePay = useApplePay(
        {
            amountAndCurrency,
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), {
                        paymentMethodValue: PAYMENT_METHOD_TYPES.APPLE_PAY,
                        ...operationProps,
                    }),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.APPLE_PAY,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),

                        paymentProcessorType: applePay.meta.type,
                    }
                ),
        },
        {
            api,
            handles: chargebeeHandles,
            events: chargebeeEvents,
            applePayModalHandles,
        }
    );

    const googlePay = useGooglePay(
        {
            amountAndCurrency,
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), {
                        paymentMethodValue: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
                        ...operationProps,
                    }),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),

                        paymentProcessorType: googlePay.meta.type,
                    }
                ),
        },
        {
            api,
            handles: chargebeeHandles,
            events: chargebeeEvents,
            googlePayModalHandles,
            verifyPayment: verifyPaymentChargebeeCard,
        }
    );

    const paymentMethodType: PlainPaymentMethodType | undefined = methods.selectedMethod?.type;
    const selectedProcessor = useMemo(() => {
        if (isExistingPaymentMethod(paymentMethodValue)) {
            if (
                paymentMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD ||
                paymentMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL ||
                paymentMethodType === PAYMENT_METHOD_TYPES.APPLE_PAY ||
                paymentMethodType === PAYMENT_METHOD_TYPES.GOOGLE_PAY ||
                paymentMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
            ) {
                return savedChargebeeMethod;
            }
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
            return chargebeeCard;
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
            return chargebeePaypal;
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
            return bitcoinChargebee;
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT) {
            return directDebit;
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.APPLE_PAY) {
            return applePay;
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.GOOGLE_PAY) {
            return googlePay;
        }
    }, [
        paymentMethodValue,
        paymentMethodType,
        savedChargebeeMethod,
        chargebeeCard,
        chargebeePaypal,
        applePay,
        googlePay,
    ]);

    const initialized = !methods.loading;

    const reset = () => {
        [
            savedChargebeeMethod,
            chargebeeCard,
            chargebeePaypal,
            bitcoinChargebee,
            directDebit,
            applePay,
            googlePay,
        ].forEach((paymentProcessor) => paymentProcessor.reset());
    };

    const currencyOverride = useSepaCurrencyOverride({
        currentCurrency: currency,
        currentSelectedMethodType: paymentMethodType,
        methods: methods.allMethods,
    });

    return {
        methods,
        chargebeeCard,
        chargebeePaypal,
        applePay,
        googlePay,
        bitcoinChargebee,
        selectedProcessor,
        flow,
        amount,
        currency,
        paymentContext,
        directDebit,
        initialized,
        reset,
        currencyOverride,
    };
};
