import { useEffect, useRef, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import {
    AmountAndCurrency,
    ChargeableV5PaymentParameters,
    ChargebeeCardPaymentProcessor,
    ChargebeeCardPaymentProcessorState,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    ChargebeeKillSwitch,
    PaymentVerificatorV5,
} from '../core';
import { PaymentProcessorHook } from './interface';

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    onChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>;
    verifyOnly?: boolean;
}

export interface Dependencies {
    api: Api;
    verifyPayment: PaymentVerificatorV5;
    handles: ChargebeeIframeHandles;
    events: ChargebeeIframeEvents;
    chargebeeKillSwitch: ChargebeeKillSwitch;
}

type Overrides = {
    verifyPaymentToken: () => Promise<ChargeableV5PaymentParameters>;
    paymentProcessor?: ChargebeeCardPaymentProcessor;
    processPaymentToken: () => Promise<ChargeableV5PaymentParameters>;
};

export type ChargebeeCardProcessorHook = Omit<PaymentProcessorHook, keyof Overrides> & {
    countryCode: string;
    setCountryCode: (countryCode: string) => void;
    postalCode: string;
    setPostalCode: (postalCode: string) => void;
    errors: Record<string, string>;
    submitted: boolean;
    reset: () => void;
} & Overrides;

export const useChargebeeCard = (
    { amountAndCurrency, onChargeable, verifyOnly }: Props,
    { api, verifyPayment, handles, events, chargebeeKillSwitch }: Dependencies
): ChargebeeCardProcessorHook => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);

    const [countryCode, setCountryCode] = useState('');
    const [postalCode, setPostalCode] = useState('');

    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken, withVerifyingToken] = useLoading();
    const processingToken = fetchingToken || verifyingToken;

    const paymentProcessorRef = useRef(
        new ChargebeeCardPaymentProcessor(
            verifyPayment,
            api,
            amountAndCurrency,
            handles,
            events,
            !!verifyOnly,
            chargebeeKillSwitch,
            onChargeable
        )
    );

    useEffect(() => {
        const setters: Record<keyof ChargebeeCardPaymentProcessorState, (...args: any[]) => any> = {
            countryCode: setCountryCode,
            postalCode: setPostalCode,
            submitted: setSubmitted,
        };

        const paymentProcessor = paymentProcessorRef.current;

        paymentProcessor.onStateUpdated(
            (updatedProperties) => {
                for (const [key, value] of Object.entries(updatedProperties)) {
                    const setter = setters[key as keyof ChargebeeCardPaymentProcessorState];
                    setter?.(value);
                }

                setErrors(paymentProcessor.getErrors());
            },
            {
                initial: true,
            }
        );

        return () => paymentProcessorRef.current.destroy();
    }, []);

    useEffect(() => {
        paymentProcessorRef.current.amountAndCurrency = amountAndCurrency;
        paymentProcessorRef.current.reset();
    }, [amountAndCurrency]);

    useEffect(() => {
        paymentProcessorRef.current.onTokenIsChargeable = onChargeable;
    }, [onChargeable]);

    const reset = () => paymentProcessorRef.current.reset();

    const fetchPaymentToken = async () => {
        const promise = paymentProcessorRef.current.fetchPaymentToken();
        withFetchingToken(promise).catch(noop);
        return promise;
    };
    const verifyPaymentToken = () => {
        const tokenPromise = paymentProcessorRef.current.verifyPaymentToken();
        withVerifyingToken(tokenPromise).catch(noop);
        return tokenPromise;
    };

    const processPaymentToken = async () => {
        if (!paymentProcessorRef.current.fetchedPaymentToken) {
            await fetchPaymentToken();
        }

        try {
            const token = await verifyPaymentToken();
            return token;
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
        countryCode,
        postalCode,
        setPostalCode: (postalCode: string) => paymentProcessorRef.current.setPostalCode(postalCode),
        setCountryCode: (countryCode: string) => paymentProcessorRef.current.setCountryCode(countryCode),
        errors: submitted ? errors : {},
        submitted,
        paymentProcessor: paymentProcessorRef.current,
        processPaymentToken,
        processingToken,
        reset,
        meta: {
            type: 'chargebee-card',
        },
    };
};
