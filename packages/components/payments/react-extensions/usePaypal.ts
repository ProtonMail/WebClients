import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import {
    type AmountAndCurrency,
    type ChargeablePaymentParameters,
    type PaymentVerificator,
    PaypalPaymentProcessor,
} from '@proton/payments';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { PaymentProcessorHook, PaymentProcessorType } from './interface';
import { usePaymentProcessor } from './usePaymentProcessor';

interface Props {
    amountAndCurrency: AmountAndCurrency;
    isCredit: boolean;
    onChargeable?: (data: ChargeablePaymentParameters) => Promise<unknown>;
    ignoreAmountCheck?: boolean;
    onProcessPaymentToken?: (paymentMethodType: PaymentProcessorType) => void;
    onProcessPaymentTokenFailed?: (paymentMethodType: PaymentProcessorType) => void;
}

interface Dependencies {
    api: Api;
    verifyPayment: PaymentVerificator;
}

export type PaypalProcessorHook = PaymentProcessorHook & {
    reset: () => void;
    tokenFetched: boolean;
    verificationError: any;
    disabled: boolean;
    isInitialState: boolean;
    meta: {
        type: 'paypal' | 'paypal-credit';
    };
};

/**
 * React wrapper for {@link PaypalPaymentProcessor}. It provides a set of proxies and also some additional functionality
 * like `processPaymentToken` method that supposed to be the main action.
 */
export const usePaypal = (
    {
        amountAndCurrency,
        isCredit,
        onChargeable,
        ignoreAmountCheck,
        onProcessPaymentToken,
        onProcessPaymentTokenFailed,
    }: Props,
    { api, verifyPayment }: Dependencies
): PaypalProcessorHook => {
    const paymentProcessor = usePaymentProcessor(
        () =>
            new PaypalPaymentProcessor(verifyPayment, api, amountAndCurrency, isCredit, onChargeable, ignoreAmountCheck)
    );
    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken, withVerifyingToken] = useLoading();
    const [verificationError, setVerificationError] = useState<any>(null);
    const [disabled, setDisabled] = useState(false);

    const processingToken = fetchingToken || verifyingToken;

    const [tokenFetched, setTokenFetched] = useState(false);

    const isInitialState = !tokenFetched && !verificationError;

    useEffect(() => {
        paymentProcessor.setAmountAndCurrency(amountAndCurrency);
    }, [amountAndCurrency]);

    useEffect(() => {
        paymentProcessor.onTokenIsChargeable = onChargeable;
    }, [onChargeable]);

    useEffect(() => {
        paymentProcessor.onStateUpdated((state) => {
            if (Object.hasOwn(state, 'fetchedPaymentToken')) {
                setTokenFetched(state.fetchedPaymentToken !== null);
            }

            if (Object.hasOwn(state, 'verificationError')) {
                setVerificationError(state.verificationError);
            }

            if (Object.hasOwn(state, 'disabled')) {
                setDisabled(!!state.disabled);
            }
        });

        return () => paymentProcessor.destroy();
    }, []);

    const reset = () => paymentProcessor.reset();

    const fetchPaymentToken = async () => withFetchingToken(paymentProcessor.fetchPaymentToken());
    const verifyPaymentToken = async () => {
        const tokenPromise = paymentProcessor.verifyPaymentToken();
        withVerifyingToken(tokenPromise).catch(noop);
        return tokenPromise;
    };

    const metaType: PaymentProcessorType = isCredit ? 'paypal-credit' : 'paypal';
    const processPaymentToken = async () => {
        onProcessPaymentToken?.(metaType);

        if (!paymentProcessor.fetchedPaymentToken) {
            await fetchPaymentToken();
        }

        try {
            return await verifyPaymentToken();
        } catch (error) {
            onProcessPaymentTokenFailed?.(metaType);
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
        paymentProcessor,
        reset,
        processPaymentToken,
        processingToken,
        verificationError,
        disabled,
        isInitialState,
        meta: {
            type: metaType,
        },
    };
};
