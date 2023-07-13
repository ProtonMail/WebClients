import { useEffect, useRef, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import {
    AmountAndCurrency,
    CardModel,
    CardPaymentProcessor,
    CardPaymentProcessorState,
    ChargeablePaymentParameters,
    PaymentVerificator,
    getErrors,
} from '../core';
import { PaymentProcessorHook } from './interface';

export interface Dependencies {
    api: Api;
    verifyPayment: PaymentVerificator;
}

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    initialCard?: CardModel;
    onChargeable?: (data: ChargeablePaymentParameters) => Promise<unknown>;
}

export type CardProcessorHook = PaymentProcessorHook & {
    card: CardModel;
    setCardProperty: (key: keyof CardModel, value: any) => void;
    paymentProcessor: CardPaymentProcessor;
    errors: Record<string, string>;
    submitted: boolean;
};

export const useCard = (
    { amountAndCurrency, initialCard, onChargeable }: Props,
    { api, verifyPayment }: Dependencies
): CardProcessorHook => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);

    const paymentProcessorRef = useRef(new CardPaymentProcessor(verifyPayment, api, amountAndCurrency, onChargeable));
    const [card, setCard] = useState(paymentProcessorRef.current.card);

    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken, withVerifyingToken] = useLoading();
    const processingToken = fetchingToken || verifyingToken;

    useEffect(() => {
        if (initialCard) {
            paymentProcessorRef.current.updateState({ card: initialCard });
        }

        const setters: Record<keyof CardPaymentProcessorState, (...args: any[]) => any> = {
            card: setCard,
            cardSubmitted: setSubmitted,
        };

        const paymentProcessor = paymentProcessorRef.current;

        paymentProcessor.onStateUpdated(
            (updatedProperties) => {
                for (const [key, value] of Object.entries(updatedProperties)) {
                    const setter = setters[key as keyof CardPaymentProcessorState];
                    setter?.(value);
                }

                setErrors(getErrors(paymentProcessor.card));
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

    const reset = () => paymentProcessorRef.current.reset();

    const fetchPaymentToken = async () => withFetchingToken(paymentProcessorRef.current.fetchPaymentToken());
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
        card,
        setCardProperty: (key: keyof CardModel, value: any) =>
            paymentProcessorRef.current.updateCardProperty(key, value),
        errors: submitted ? errors : {},
        submitted,
        paymentProcessor: paymentProcessorRef.current,
        processPaymentToken,
        processingToken,
        meta: {
            type: 'card',
        },
    };
};
