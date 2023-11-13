import { useMemo, useRef } from 'react';

import { buyCredit, payInvoice, subscribe } from '@proton/shared/lib/api/payments';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { Api, Currency, Cycle, PlanIDs } from '@proton/shared/lib/interfaces';

import {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    PAYMENT_METHOD_TYPES,
    PaymentMethodFlows,
    PaymentMethodType,
    PaymentVerificator,
    isExistingPaymentMethod,
} from '../core';
import { useCard } from './useCard';
import { OnMethodChangedHandler, useMethods } from './useMethods';
import { usePaypal } from './usePaypal';
import { useSavedMethod } from './useSavedMethod';

export interface OperationsSubscriptionData {
    Plans: PlanIDs;
    Cycle: Cycle;
    Codes?: string[];
    product: ProductParam;
}

export interface OperationsInvoiceData {
    invoiceId: string;
}

export interface OperationsData {
    subscription?: OperationsSubscriptionData;
    invoice?: OperationsInvoiceData;
}

export interface Operations {
    buyCredit: () => Promise<unknown>;
    payInvoice: () => Promise<unknown>;
    subscribe: () => Promise<unknown>;
}

function getOperations(api: Api, params: ChargeablePaymentParameters, operationsData: OperationsData): Operations {
    return {
        buyCredit: async () => {
            return api(buyCredit(params));
        },
        payInvoice: async () => {
            if (!operationsData?.invoice) {
                throw new Error('The operations data for invoice must be provided in the facade');
            }

            return api(payInvoice(operationsData.invoice.invoiceId, params));
        },
        subscribe: async () => {
            if (!operationsData?.subscription) {
                throw new Error('The operations data for subscription must be provided in the facade');
            }

            const { product, ...data } = operationsData.subscription;

            return api({
                ...subscribe(
                    {
                        ...params,
                        ...data,
                    },
                    product
                ),
                timeout: 60000 * 2,
            });
        },
    };
}

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

export const usePaymentFacade = (
    {
        amount,
        currency,
        onChargeable,
        coupon,
        flow,
        onMethodChanged,
    }: {
        amount: number;
        currency: Currency;
        onChargeable: (
            operations: Operations,
            data: {
                chargeablePaymentParameters: ChargeablePaymentParameters;
                source: PaymentMethodType;
                context: OperationsData;
            }
        ) => Promise<unknown>;
        coupon?: string;
        flow: PaymentMethodFlows;
        onMethodChanged?: OnMethodChangedHandler;
    },
    {
        api,
        isAuthenticated,
        verifyPayment,
        verifyPaymentPaypal,
    }: {
        api: Api;
        isAuthenticated: boolean;
        verifyPayment: PaymentVerificator;
        verifyPaymentPaypal: PaymentVerificator;
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

    const methods = useMethods(
        {
            amount,
            coupon: coupon ?? '',
            flow,
            onMethodChanged,
        },
        {
            api,
            isAuthenticated,
        }
    );

    const savedMethod = useSavedMethod(
        {
            amountAndCurrency,
            savedMethod: methods.savedSelectedMethod,
            onChargeable: (params, paymentMethodId) =>
                onChargeable(getOperations(api, params, paymentContext.getOperationsData()), {
                    chargeablePaymentParameters: params,
                    source: paymentMethodId,
                    context: paymentContext.getOperationsData(),
                }),
        },
        {
            api,
            verifyPayment,
        }
    );

    const card = useCard(
        {
            amountAndCurrency,
            onChargeable: (params) =>
                onChargeable(getOperations(api, params, paymentContext.getOperationsData()), {
                    chargeablePaymentParameters: params,
                    source: PAYMENT_METHOD_TYPES.CARD,
                    context: paymentContext.getOperationsData(),
                }),
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
                onChargeable(getOperations(api, params, paymentContext.getOperationsData()), {
                    chargeablePaymentParameters: params,
                    source: PAYMENT_METHOD_TYPES.PAYPAL,
                    context: paymentContext.getOperationsData(),
                }),
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
                onChargeable(getOperations(api, params, paymentContext.getOperationsData()), {
                    chargeablePaymentParameters: params,
                    source: PAYMENT_METHOD_TYPES.PAYPAL_CREDIT,
                    context: paymentContext.getOperationsData(),
                }),
            ignoreAmountCheck: paypalIgnoreAmountCheck,
        },
        {
            api,
            verifyPayment: verifyPaymentPaypal,
        }
    );

    const paymentMethodType: PaymentMethodType | undefined = methods.selectedMethod?.value;
    const selectedProcessor = useMemo(() => {
        if (isExistingPaymentMethod(paymentMethodType)) {
            return savedMethod;
        }

        if (paymentMethodType === PAYMENT_METHOD_TYPES.CARD) {
            return card;
        }

        if (paymentMethodType === PAYMENT_METHOD_TYPES.PAYPAL) {
            return paypal;
        }

        if (paymentMethodType === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) {
            return paypalCredit;
        }
    }, [paymentMethodType, card, savedMethod, paypal, paypalCredit]);

    return {
        methods,
        savedMethod,
        card,
        paypal,
        paypalCredit,
        selectedProcessor,
        flow,
        amount,
        currency,
        paymentContext,
    };
};
