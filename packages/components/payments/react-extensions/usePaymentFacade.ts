import { useMemo, useRef } from 'react';

import { PaymentsVersion, buyCredit, payInvoice, setPaymentMethodV5, subscribe } from '@proton/shared/lib/api/payments';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { ADDON_NAMES, PLANS } from '@proton/shared/lib/constants';
import { Api, ChargebeeEnabled, Currency, Cycle, PlanIDs } from '@proton/shared/lib/interfaces';

import {
    AmountAndCurrency,
    BillingAddress,
    ChargeablePaymentParameters,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    ChargebeeKillSwitch,
    ChargebeePaypalModalHandles,
    ForceEnableChargebee,
    PAYMENT_METHOD_TYPES,
    PaymentMethodFlows,
    PaymentMethodStatusExtended,
    PaymentMethodType,
    PaymentVerificator,
    PaymentVerificatorV5,
    PlainPaymentMethodType,
    SavedPaymentMethod,
    isExistingPaymentMethod,
} from '../core';
import { PaymentProcessorType } from './interface';
import useBitcoin from './useBitcoin';
import { useCard } from './useCard';
import { useChargebeeCard } from './useChargebeeCard';
import { useChargebeePaypal } from './useChargebeePaypal';
import { OnMethodChangedHandler, useMethods } from './useMethods';
import { usePaymentsApi } from './usePaymentsApi';
import { usePaypal } from './usePaypal';
import { useSavedChargebeeMethod } from './useSavedChargebeeMethod';
import { useSavedMethod } from './useSavedMethod';

export interface OperationsSubscriptionData {
    Plans: PlanIDs;
    Cycle: Cycle;
    Codes?: string[];
    product: ProductParam;
    taxBillingAddress: BillingAddress;
}

export interface OperationsInvoiceData {
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
    payInvoice: (invoiceId: string) => Promise<unknown>;
    subscribe: (operationsDataParam?: OperationsSubscriptionData) => Promise<unknown>;
    savePaymentMethod: () => Promise<unknown>;
}

function getOperations(
    api: Api,
    params: ChargeablePaymentParameters,
    operationsData: OperationsData,
    paymentsVersion: PaymentsVersion,
    afterOperation?: () => void
): Operations {
    const wrappedAfterOperation = <T>(result: T) => {
        afterOperation?.();
        return result;
    };

    return {
        buyCredit: async () => {
            return api(buyCredit(params, paymentsVersion)).then(wrappedAfterOperation);
        },
        payInvoice: async (invoiceId: string) => {
            return api(payInvoice(invoiceId, params)).then(wrappedAfterOperation);
        },
        subscribe: async (operationsDataParam?: OperationsSubscriptionData) => {
            if (!operationsData?.subscription && !operationsDataParam) {
                throw new Error('The operations data for subscription must be provided in the facade');
            }

            const { product, taxBillingAddress, ...data } = (operationsData.subscription ??
                operationsDataParam) as OperationsSubscriptionData;

            const BillingAddress: BillingAddress = {
                State: taxBillingAddress.State,
                CountryCode: taxBillingAddress.CountryCode,
            };

            return api(
                subscribe(
                    {
                        PaymentToken: params.PaymentToken,
                        BillingAddress,
                        ...params,
                        ...data,
                    },
                    product,
                    paymentsVersion
                )
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
        paymentMethodStatusExtended,
        isChargebeeEnabled,
        chargebeeKillSwitch,
        forceEnableChargebee,
        selectedPlanName,
        onProcessPaymentToken,
        onProcessPaymentTokenFailed,
        enableChargebeeB2B,
        billingAddress,
        bitcoinChargebeeEnabled,
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
                paymentsVersion: PaymentsVersion;
                paymentProcessorType: PaymentProcessorType;
            }
        ) => Promise<unknown>;
        coupon?: string;
        flow: PaymentMethodFlows;
        onMethodChanged?: OnMethodChangedHandler;
        paymentMethods?: SavedPaymentMethod[];
        paymentMethodStatusExtended?: PaymentMethodStatusExtended;
        isChargebeeEnabled: () => ChargebeeEnabled;
        chargebeeKillSwitch: ChargebeeKillSwitch;
        forceEnableChargebee: ForceEnableChargebee;
        selectedPlanName: PLANS | ADDON_NAMES | undefined;
        onProcessPaymentToken: (paymentMethodType: PaymentProcessorType) => void;
        onProcessPaymentTokenFailed: (paymentMethodType: PaymentProcessorType) => void;
        enableChargebeeB2B: boolean;
        billingAddress?: BillingAddress;
        bitcoinChargebeeEnabled: boolean;
    },
    {
        api,
        isAuthenticated,
        verifyPayment,
        verifyPaymentPaypal,
        verifyPaymentChargebeeCard,
        chargebeeHandles,
        chargebeeEvents,
        chargebeePaypalModalHandles,
    }: {
        api: Api;
        isAuthenticated: boolean;
        verifyPayment: PaymentVerificator;
        verifyPaymentPaypal: PaymentVerificator;
        verifyPaymentChargebeeCard: PaymentVerificatorV5;
        chargebeeHandles: ChargebeeIframeHandles;
        chargebeeEvents: ChargebeeIframeEvents;
        chargebeePaypalModalHandles?: ChargebeePaypalModalHandles;
    }
) => {
    const amountAndCurrency: AmountAndCurrency = useMemo(
        () => ({
            Amount: amount,
            Currency: currency,
        }),
        [amount, currency]
    );

    const isChargebeeAllowed = isChargebeeEnabled() === ChargebeeEnabled.CHARGEBEE_ALLOWED;

    const paymentContext = usePaymentContext();
    const { paymentsApi } = usePaymentsApi(api);

    const methods = useMethods(
        {
            amount,
            coupon: coupon ?? '',
            flow,
            onMethodChanged,
            paymentMethods,
            paymentMethodStatusExtended,
            isChargebeeEnabled,
            paymentsApi,
            selectedPlanName,
            enableChargebeeB2B,
            bitcoinChargebeeEnabled,
        },
        {
            api,
            isAuthenticated,
        }
    );

    const savedMethod = useSavedMethod(
        {
            amountAndCurrency,
            // If Chargebee is allowed and there is a saved internal payment method, then we are in migration mode.
            // It means that we should go with useSavedChargebeeMethod instead of useSavedMethod.
            savedMethod: isChargebeeAllowed ? undefined : methods.savedInternalSelectedMethod,
            onProcessPaymentToken,
            onProcessPaymentTokenFailed,
            onChargeable: (params, paymentMethodId) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v4', chargebeeKillSwitch),
                    {
                        chargeablePaymentParameters: params,
                        source: paymentMethodId,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v4',
                        paymentProcessorType: savedMethod.meta.type,
                    }
                ),
        },
        {
            api,
            verifyPayment,
        }
    );

    const savedChargebeeMethod = useSavedChargebeeMethod(
        {
            amountAndCurrency,
            // If we are in migration mode (there is a saved payment internal method and Chargebee is allowed),
            // the we prefer to use the saved internal payment method. There shouldn't be any saved external payment
            // method in this case, but we still keep it as a fallback.
            // If Chargebee is not allowed, then we use the saved external payment method.
            savedMethod: isChargebeeAllowed
                ? methods.savedInternalSelectedMethod ?? methods.savedExternalSelectedMethod
                : methods.savedExternalSelectedMethod,
            onProcessPaymentToken,
            onProcessPaymentTokenFailed,
            onChargeable: (params, paymentMethodId) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v5', forceEnableChargebee),
                    {
                        chargeablePaymentParameters: params,
                        source: paymentMethodId,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v5',
                        paymentProcessorType: savedChargebeeMethod.meta.type,
                    }
                ),
        },
        {
            api,
            verifyPayment: verifyPaymentChargebeeCard,
            handles: chargebeeHandles,
            events: chargebeeEvents,
        }
    );

    const card = useCard(
        {
            amountAndCurrency,
            onProcessPaymentToken,
            onProcessPaymentTokenFailed,
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v4', chargebeeKillSwitch),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.CARD,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v4',
                        paymentProcessorType: card.meta.type,
                    }
                ),
            verifyOnly: flow === 'add-card',
        },
        {
            api,
            verifyPayment,
        }
    );

    const paypalIgnoreAmountCheck = flow === 'invoice';
    const paypal = usePaypal(
        {
            amountAndCurrency,
            isCredit: false,
            onProcessPaymentToken,
            onProcessPaymentTokenFailed,
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v4', chargebeeKillSwitch),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.PAYPAL,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v4',
                        paymentProcessorType: paypal.meta.type,
                    }
                ),
            ignoreAmountCheck: paypalIgnoreAmountCheck,
        },
        {
            api,
            verifyPayment: verifyPaymentPaypal,
        }
    );

    const paypalCredit = usePaypal(
        {
            amountAndCurrency,
            isCredit: true,
            onProcessPaymentToken,
            onProcessPaymentTokenFailed,
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v4', chargebeeKillSwitch),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.PAYPAL_CREDIT,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v4',
                        paymentProcessorType: paypalCredit.meta.type,
                    }
                ),
            ignoreAmountCheck: paypalIgnoreAmountCheck,
        },
        {
            api,
            verifyPayment: verifyPaymentPaypal,
        }
    );

    const chargebeeCard = useChargebeeCard(
        {
            amountAndCurrency,
            onProcessPaymentToken,
            onProcessPaymentTokenFailed,
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v5', forceEnableChargebee),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v5',
                        paymentProcessorType: chargebeeCard.meta.type,
                    }
                ),
            verifyOnly: flow === 'add-card',
        },
        {
            api,
            verifyPayment: verifyPaymentChargebeeCard,
            handles: chargebeeHandles,
            events: chargebeeEvents,
            chargebeeKillSwitch,
            forceEnableChargebee,
        }
    );

    const chargebeePaypal = useChargebeePaypal(
        {
            amountAndCurrency,
            isCredit: false,
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v5', forceEnableChargebee),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v5',
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
            chargebeeKillSwitch,
            forceEnableChargebee,
        }
    );

    const paymentMethodValue: PaymentMethodType | undefined = methods.selectedMethod?.value;
    const bitcoinInhouse = useBitcoin({
        api,
        Amount: amount,
        Currency: currency,
        enablePolling: paymentMethodValue === PAYMENT_METHOD_TYPES.BITCOIN,
        paymentsVersion: 'v4',
        onTokenValidated: (params: ChargeablePaymentParameters) => {
            return onChargeable(
                getOperations(api, params, paymentContext.getOperationsData(), 'v4', chargebeeKillSwitch),
                {
                    chargeablePaymentParameters: params,
                    source: PAYMENT_METHOD_TYPES.BITCOIN,
                    sourceType: params.type,
                    context: paymentContext.getOperationsData(),
                    paymentsVersion: 'v4',
                    paymentProcessorType: bitcoinInhouse.meta.type,
                }
            );
        },
    });

    const bitcoinChargebee = useBitcoin({
        api,
        Amount: amount,
        Currency: currency,
        enablePolling: paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
        paymentsVersion: 'v5',
        billingAddress,
        onTokenValidated: (params: ChargeablePaymentParameters) => {
            return onChargeable(
                getOperations(api, params, paymentContext.getOperationsData(), 'v5', forceEnableChargebee),
                {
                    chargeablePaymentParameters: params,
                    source: PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
                    sourceType: params.type,
                    context: paymentContext.getOperationsData(),
                    paymentsVersion: 'v5',
                    paymentProcessorType: bitcoinChargebee.meta.type,
                }
            );
        },
    });

    const paymentMethodType: PlainPaymentMethodType | undefined = methods.selectedMethod?.type;
    const selectedProcessor = useMemo(() => {
        if (isExistingPaymentMethod(paymentMethodValue)) {
            if (
                // If Chargebee is allowed and the saved method is internal (migration mode), then we use the
                // saved Chargebee method processor.
                isChargebeeAllowed ||
                paymentMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD ||
                paymentMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
            ) {
                return savedChargebeeMethod;
            } else if (
                paymentMethodType === PAYMENT_METHOD_TYPES.CARD ||
                paymentMethodType === PAYMENT_METHOD_TYPES.PAYPAL
            ) {
                return savedMethod;
            }
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.CARD) {
            return card;
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.PAYPAL) {
            return paypal;
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) {
            return paypalCredit;
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
            return chargebeeCard;
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
            return chargebeePaypal;
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.BITCOIN) {
            return bitcoinInhouse;
        }

        if (paymentMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
            return bitcoinChargebee;
        }
    }, [
        paymentMethodValue,
        paymentMethodType,
        card,
        savedMethod,
        paypal,
        paypalCredit,
        savedChargebeeMethod,
        chargebeeCard,
        chargebeePaypal,
    ]);

    return {
        methods,
        savedMethod,
        card,
        paypal,
        paypalCredit,
        chargebeeCard,
        chargebeePaypal,
        bitcoinInhouse,
        bitcoinChargebee,
        selectedProcessor,
        flow,
        amount,
        currency,
        paymentContext,
    };
};
