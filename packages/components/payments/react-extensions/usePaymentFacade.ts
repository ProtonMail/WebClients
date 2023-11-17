import { useMemo, useRef } from 'react';

import { PaymentsVersion, buyCredit, payInvoice, subscribe } from '@proton/shared/lib/api/payments';
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
    payInvoice: () => Promise<unknown>;
    subscribe: (operationsDataParam?: OperationsSubscriptionData) => Promise<unknown>;
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
            return api(buyCredit(params)).then(wrappedAfterOperation);
        },
        payInvoice: async () => {
            if (!operationsData?.invoice) {
                throw new Error('The operations data for invoice must be provided in the facade');
            }

            return api(payInvoice(operationsData.invoice.invoiceId, params)).then(wrappedAfterOperation);
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
    };
}

/**
 * Stores the data for operations. That's meant to bypass React's rendering cycle.
 * Perhaps will be changed in the future.
 */
const usePaymentContext = () => {
    const subscriptionData = useRef<OperationsSubscriptionData>();
    const invoiceData = useRef<OperationsInvoiceData>();

    return {
        setSubscriptionData: (data: OperationsSubscriptionData | undefined) => {
            subscriptionData.current = data;
        },
        getSubscriptionData: () => {
            return subscriptionData.current;
        },
        setInvoiceData: (data: OperationsInvoiceData | undefined) => {
            invoiceData.current = data;
        },
        getInvoiceData: () => {
            return invoiceData.current;
        },
        getOperationsData: (): OperationsData => {
            return {
                subscription: subscriptionData.current,
                invoice: invoiceData.current,
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
        chargebeeEnabled,
        chargebeeKillSwitch,
        forceEnableChargebee,
        selectedPlanName,
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
            }
        ) => Promise<unknown>;
        coupon?: string;
        flow: PaymentMethodFlows;
        onMethodChanged?: OnMethodChangedHandler;
        paymentMethods?: SavedPaymentMethod[];
        paymentMethodStatusExtended?: PaymentMethodStatusExtended;
        chargebeeEnabled: ChargebeeEnabled;
        chargebeeKillSwitch: ChargebeeKillSwitch;
        forceEnableChargebee: ForceEnableChargebee;
        selectedPlanName: PLANS | ADDON_NAMES | undefined;
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
            chargebeeEnabled,
            paymentsApi,
            selectedPlanName,
        },
        {
            api,
            isAuthenticated,
        }
    );

    const savedMethod = useSavedMethod(
        {
            amountAndCurrency,
            savedMethod: methods.savedInternalSelectedMethod,
            onChargeable: (params, paymentMethodId) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v4', chargebeeKillSwitch),
                    {
                        chargeablePaymentParameters: params,
                        source: paymentMethodId,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v4',
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
            savedMethod: methods.savedExternalSelectedMethod,
            onChargeable: (params, paymentMethodId) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v5', forceEnableChargebee),
                    {
                        chargeablePaymentParameters: params,
                        source: paymentMethodId,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v5',
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
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v4', chargebeeKillSwitch),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.CARD,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v4',
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
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v4', chargebeeKillSwitch),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.PAYPAL,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v4',
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
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v4', chargebeeKillSwitch),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.PAYPAL_CREDIT,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v4',
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
            onChargeable: (params) =>
                onChargeable(
                    getOperations(api, params, paymentContext.getOperationsData(), 'v5', forceEnableChargebee),
                    {
                        chargeablePaymentParameters: params,
                        source: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                        sourceType: params.type,
                        context: paymentContext.getOperationsData(),
                        paymentsVersion: 'v5',
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
        }
    );

    const paymentMethodValue: PaymentMethodType | undefined = methods.selectedMethod?.value;
    const paymentMethodType: PlainPaymentMethodType | undefined = methods.selectedMethod?.type;
    const selectedProcessor = useMemo(() => {
        if (isExistingPaymentMethod(paymentMethodValue)) {
            if (paymentMethodType === PAYMENT_METHOD_TYPES.CARD || paymentMethodType === PAYMENT_METHOD_TYPES.PAYPAL) {
                return savedMethod;
            } else if (
                paymentMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD ||
                paymentMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
            ) {
                return savedChargebeeMethod;
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
    }, [paymentMethodValue, paymentMethodType, card, savedMethod, paypal, paypalCredit, savedChargebeeMethod]);

    return {
        methods,
        savedMethod,
        card,
        paypal,
        paypalCredit,
        chargebeeCard,
        chargebeePaypal,
        selectedProcessor,
        flow,
        amount,
        currency,
        paymentContext,
    };
};
