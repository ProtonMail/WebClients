import { useEffect, useRef, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { AmountAndCurrency, ChargeablePaymentParameters, PaymentVerificator } from '../core';
import { PaypalPaymentProcessor } from '../core/payment-processors/paypalPayment';
import { PaymentProcessorHook } from './interface';

interface Props {
    amountAndCurrency: AmountAndCurrency;
    isCredit: boolean;
    onChargeable?: (data: ChargeablePaymentParameters) => Promise<unknown>;
}

interface Dependencies {
    api: Api;
    verifyPayment: PaymentVerificator;
}

export type PaypalProcessorHook = PaymentProcessorHook & {
    reset: () => void;
    tokenFetched: boolean;
    verificationError: any;
    meta: {
        type: 'paypal' | 'paypal-credit';
    };
};

export function isPaypalProcessorHook(hook: any): hook is PaypalProcessorHook {
    return hook && hook.meta && (hook.meta.type === 'paypal' || hook.meta.type === 'paypal-credit');
}

export const usePaypal = (
    { amountAndCurrency, isCredit, onChargeable }: Props,
    { api, verifyPayment }: Dependencies
): PaypalProcessorHook => {
    const paymentProcessorRef = useRef(
        new PaypalPaymentProcessor(verifyPayment, api, amountAndCurrency, isCredit, onChargeable)
    );
    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken, withVerifyingToken] = useLoading();
    const [verificationError, setVerificationError] = useState<any>(null);

    const processingToken = fetchingToken || verifyingToken;

    const [tokenFetched, setTokenFetched] = useState(false);

    useEffect(() => {
        paymentProcessorRef.current.amountAndCurrency = amountAndCurrency;
    }, [amountAndCurrency]);

    useEffect(() => {
        paymentProcessorRef.current.onStateUpdated((state) => {
            if (Object.hasOwn(state, 'fetchedPaymentToken')) {
                setTokenFetched(state.fetchedPaymentToken !== null);
            }

            if (Object.hasOwn(state, 'verificationError')) {
                setVerificationError(state.verificationError);
            }
        });

        return () => paymentProcessorRef.current.destroy();
    }, []);

    const reset = () => paymentProcessorRef.current.reset();

    const fetchPaymentToken = async () => withFetchingToken(paymentProcessorRef.current.fetchPaymentToken());
    const verifyPaymentToken = async () => {
        const tokenPromise = paymentProcessorRef.current.verifyPaymentToken();
        withVerifyingToken(tokenPromise).catch(noop);
        return tokenPromise;
    };
    const processPaymentToken = async () => {
        if (!paymentProcessorRef.current.fetchedPaymentToken) {
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
        tokenFetched,
        fetchPaymentToken,
        fetchingToken,
        verifyPaymentToken,
        verifyingToken,
        paymentProcessor: paymentProcessorRef.current,
        reset,
        processPaymentToken,
        processingToken,
        verificationError,
        meta: {
            type: isCredit ? 'paypal-credit' : 'paypal',
        },
    };
};
