import { useEffect, useRef } from 'react';

import { useLoading } from '@proton/hooks';
import {
    type AmountAndCurrency,
    type ChargeablePaymentParameters,
    type ExistingPaymentMethod,
    type PaymentVerificator,
    type SavedPaymentMethod,
    type SavedPaymentMethodExternal,
    type SavedPaymentMethodInternal,
    SavedPaymentProcessor,
} from '@proton/payments';
import { type Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { PaymentProcessorHook, PaymentProcessorType } from './interface';

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    savedMethod?: SavedPaymentMethodInternal | SavedPaymentMethodExternal | SavedPaymentMethod;
    onChargeable: (data: ChargeablePaymentParameters, paymentMethodId: ExistingPaymentMethod) => Promise<unknown>;
    onProcessPaymentToken?: (paymentMethodType: PaymentProcessorType) => void;
    onProcessPaymentTokenFailed?: (paymentMethodType: PaymentProcessorType) => void;
}

export interface Dependencies {
    verifyPayment: PaymentVerificator;
    api: Api;
}

export interface SavedMethodProcessorHook extends PaymentProcessorHook {
    paymentProcessor?: SavedPaymentProcessor;
}

/**
 * React wrapper for {@link SavedPaymentProcessor}. It provides a set of proxies and also some additional functionality
 * like `processPaymentToken` method that supposed to be the main action. The saved payment method can be either a card
 * or PayPal (not paypal-credit which can't be saved by design, as it supposed to provide one-time payment).
 */
export const useSavedMethod = (
    { amountAndCurrency, savedMethod, onChargeable, onProcessPaymentToken, onProcessPaymentTokenFailed }: Props,
    { verifyPayment, api }: Dependencies
): SavedMethodProcessorHook => {
    const paymentProcessorRef = useRef<SavedPaymentProcessor>();
    if (!paymentProcessorRef.current && savedMethod) {
        paymentProcessorRef.current = new SavedPaymentProcessor(
            verifyPayment,
            api,
            amountAndCurrency,
            savedMethod,
            (chargeablePaymentParameters: ChargeablePaymentParameters) =>
                onChargeable(chargeablePaymentParameters, savedMethod.ID)
        );
    }

    const paymentProcessor = paymentProcessorRef.current;

    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken, withVerifyingToken] = useLoading();
    const processingToken = fetchingToken || verifyingToken;

    useEffect(() => {
        return () => paymentProcessor?.destroy();
    }, []);

    useEffect(() => {
        if (paymentProcessor) {
            paymentProcessor.amountAndCurrency = amountAndCurrency;
            paymentProcessor.reset();
        }
    }, [amountAndCurrency]);

    useEffect(() => {
        if (paymentProcessor && savedMethod) {
            paymentProcessor.onTokenIsChargeable = (chargeablePaymentParameters: ChargeablePaymentParameters) =>
                onChargeable(chargeablePaymentParameters, savedMethod.ID);

            paymentProcessor.updateSavedMethod(savedMethod);
        }
    }, [savedMethod, onChargeable]);

    const reset = () => paymentProcessor?.reset();

    const fetchPaymentToken = async () => withFetchingToken(paymentProcessor?.fetchPaymentToken());
    const verifyPaymentToken = async () => {
        const tokenPromise = paymentProcessor?.verifyPaymentToken();
        if (!tokenPromise) {
            throw new Error('There is no saved method to verify');
        }

        withVerifyingToken(tokenPromise).catch(noop);
        return tokenPromise;
    };
    const processPaymentToken = async () => {
        onProcessPaymentToken?.('saved');
        if (!paymentProcessor?.fetchedPaymentToken) {
            await fetchPaymentToken();
        }

        try {
            return await verifyPaymentToken();
        } catch (error) {
            onProcessPaymentTokenFailed?.('saved');
            reset();
            throw error;
        }
    };

    return {
        fetchPaymentToken,
        fetchingToken,
        verifyPaymentToken,
        verifyingToken,
        processPaymentToken,
        processingToken,
        paymentProcessor,
        meta: {
            type: 'saved',
            data: savedMethod,
        },
    };
};
