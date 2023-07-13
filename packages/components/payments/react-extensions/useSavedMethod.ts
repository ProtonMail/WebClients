import { useEffect, useMemo } from 'react';

import { useLoading } from '@proton/hooks';
import { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ExistingPaymentMethod,
    PaymentVerificator,
    SavedPaymentMethod,
} from '../core';
import { SavedPaymentProcessor } from '../core/payment-processors/savedPayment';
import { PaymentProcessorHook } from './interface';

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    savedMethod?: SavedPaymentMethod;
    onChargeable: (data: ChargeablePaymentParameters, paymentMethodId: ExistingPaymentMethod) => Promise<unknown>;
}

export interface Dependencies {
    verifyPayment: PaymentVerificator;
    api: Api;
}

export interface SavedMethodProcessorHook extends PaymentProcessorHook {
    paymentProcessor?: SavedPaymentProcessor;
}

export const useSavedMethod = (
    { amountAndCurrency, savedMethod, onChargeable }: Props,
    { verifyPayment, api }: Dependencies
): SavedMethodProcessorHook => {
    const paymentProcessor = useMemo(() => {
        if (savedMethod) {
            return new SavedPaymentProcessor(
                verifyPayment,
                api,
                amountAndCurrency,
                savedMethod,
                (chargeablePaymentParameters: ChargeablePaymentParameters) =>
                    onChargeable(chargeablePaymentParameters, savedMethod.ID)
            );
        }
    }, [savedMethod]);

    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken, withVerifyingToken] = useLoading();
    const processingToken = fetchingToken || verifyingToken;

    useEffect(() => {
        return () => paymentProcessor?.destroy();
    }, []);

    useEffect(() => {
        if (paymentProcessor) {
            paymentProcessor.amountAndCurrency = amountAndCurrency;
        }
    }, [amountAndCurrency]);

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
        if (!paymentProcessor?.fetchedPaymentToken) {
            await fetchPaymentToken();
        }

        try {
            return await verifyPaymentToken();
        } catch (error) {
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
        },
    };
};
