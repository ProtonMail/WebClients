import { useEffect, useRef } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { type Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import {
    type AmountAndCurrency,
    type ChargeableV5PaymentParameters,
    type ChargebeeIframeEvents,
    type ChargebeeIframeHandles,
    type ForceEnableChargebee,
    type PaymentVerificatorV5,
} from '../core';
import {
    type ChargebeePaypalModalHandles,
    ChargebeePaypalPaymentProcessor,
} from '../core/payment-processors/chargebeePaypalPayment';
import { type PaymentProcessorHook } from './interface';
import { usePaymentProcessor } from './usePaymentProcessor';

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    isCredit: boolean;
    onChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>;
}

export interface Dependencies {
    api: Api;
    verifyPayment: PaymentVerificatorV5;
    handles: ChargebeeIframeHandles;
    events: ChargebeeIframeEvents;
    chargebeePaypalModalHandles: ChargebeePaypalModalHandles | undefined;
    forceEnableChargebee: ForceEnableChargebee;
}

type Overrides = {
    fetchPaymentToken: () => Promise<unknown>;
    verifyPaymentToken: () => Promise<ChargeableV5PaymentParameters>;
    paymentProcessor?: ChargebeePaypalPaymentProcessor;
    processPaymentToken: () => Promise<ChargeableV5PaymentParameters>;
};

export type ChargebeePaypalProcessorHook = Omit<PaymentProcessorHook, keyof Overrides> & {
    reset: () => void;
    initialize: (abortSignal: AbortSignal) => Promise<void>;
    initializing: boolean;
    paypalIframeLoadedRef: React.MutableRefObject<boolean>;
} & Overrides;

export const useChargebeePaypal = (
    { amountAndCurrency, isCredit, onChargeable }: Props,
    { api, verifyPayment, handles, events, chargebeePaypalModalHandles, forceEnableChargebee }: Dependencies
): ChargebeePaypalProcessorHook => {
    const paypalIframeLoadedRef = useRef(false);

    const paymentProcessor = usePaymentProcessor(
        () =>
            new ChargebeePaypalPaymentProcessor(
                verifyPayment,
                api,
                amountAndCurrency,
                handles,
                events,
                isCredit,
                forceEnableChargebee,
                chargebeePaypalModalHandles,
                onChargeable
            )
    );

    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken, withVerifyingToken] = useLoading();
    const [initializing, withInitializing] = useLoading();

    const processingToken = fetchingToken || verifyingToken;

    useEffect(() => {
        paymentProcessor.setAmountAndCurrency(amountAndCurrency);
    }, [amountAndCurrency]);

    useEffect(() => {
        paymentProcessor.onTokenIsChargeable = onChargeable;
    }, [onChargeable]);

    useEffect(() => {
        paymentProcessor.paypalModalHandles = chargebeePaypalModalHandles;
    }, [chargebeePaypalModalHandles]);

    useEffect(() => {
        return () => paymentProcessor.destroy();
    }, []);

    const reset = () => paymentProcessor.reset();

    const fetchPaymentToken = async () => {
        const promise = paymentProcessor.fetchPaymentToken();
        void withFetchingToken(promise).catch(noop);
        return promise;
    };
    const verifyPaymentToken = async () => {
        const tokenPromise = paymentProcessor.verifyPaymentToken();
        withVerifyingToken(tokenPromise).catch(noop);
        return tokenPromise;
    };
    const processPaymentToken = async () => {
        return null as any;
    };

    const initialize = async (abortSignal: AbortSignal) => {
        if (!paypalIframeLoadedRef.current) {
            return;
        }

        const initPaypalPromise = handles.initializePaypal();

        const fetchTokenPromise = fetchPaymentToken();

        withInitializing(async () => {
            await Promise.all([initPaypalPromise, fetchTokenPromise]);
            await paymentProcessor.setPaypalPaymentIntent(abortSignal);
        }).catch(noop);
    };

    return {
        paypalIframeLoadedRef,
        fetchPaymentToken,
        fetchingToken,
        verifyPaymentToken,
        verifyingToken,
        paymentProcessor,
        reset,
        processPaymentToken,
        processingToken,
        initialize,
        initializing,
        meta: {
            type: isCredit ? 'chargebee-paypal-credit' : 'chargebee-paypal',
        },
    };
};
