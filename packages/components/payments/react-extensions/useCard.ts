import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import {
    type AmountAndCurrency,
    type CardModel,
    CardPaymentProcessor,
    type CardPaymentProcessorState,
    type ChargeablePaymentParameters,
    type PaymentVerificator,
    getErrors,
} from '@proton/payments';
import { type Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { PaymentProcessorHook, PaymentProcessorType } from './interface';
import { usePaymentProcessor } from './usePaymentProcessor';

export type CardFieldStatus = {
    number: boolean;
    month: boolean;
    year: boolean;
    cvc: boolean;
    zip: boolean;
    country: boolean;
};

export const getInitialFieldStatus = (): CardFieldStatus => ({
    number: true,
    month: true,
    year: true,
    cvc: true,
    zip: true,
    country: true,
});

export interface Dependencies {
    api: Api;
    verifyPayment: PaymentVerificator;
}

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    initialCard?: CardModel;
    onChargeable?: (data: ChargeablePaymentParameters) => Promise<unknown>;
    verifyOnly?: boolean;
    onProcessPaymentToken?: (paymentMethodType: PaymentProcessorType) => void;
    onProcessPaymentTokenFailed?: (paymentMethodType: PaymentProcessorType) => void;
}

export type CardProcessorHook = PaymentProcessorHook & {
    card: CardModel;
    fieldsStatus: CardFieldStatus;
    setCardProperty: (key: keyof CardModel, value: any) => void;
    paymentProcessor: CardPaymentProcessor;
    errors: Record<string, string>;
    submitted: boolean;
};

/**
 * React wrapper for {@link CardPaymentProcessor}. It provides a set of proxies and also some additional functionality
 * like `processPaymentToken` method that supposed to be the main action. It also provides some data usefull for
 * the credit card component.
 */
export const useCard = (
    {
        amountAndCurrency,
        initialCard,
        verifyOnly,
        onChargeable,
        onProcessPaymentToken,
        onProcessPaymentTokenFailed,
    }: Props,
    { api, verifyPayment }: Dependencies
): CardProcessorHook => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);

    const paymentProcessor = usePaymentProcessor(
        () => new CardPaymentProcessor(verifyPayment, api, amountAndCurrency, !!verifyOnly, onChargeable)
    );

    const [card, setCard] = useState(paymentProcessor.card);

    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken, withVerifyingToken] = useLoading();
    const processingToken = fetchingToken || verifyingToken;

    useEffect(() => {
        paymentProcessor.onTokenIsChargeable = onChargeable;
    }, [onChargeable]);

    useEffect(() => {
        paymentProcessor.amountAndCurrency = amountAndCurrency;
        paymentProcessor.reset();
    }, [amountAndCurrency]);

    useEffect(() => {
        if (initialCard) {
            paymentProcessor.updateState({ card: initialCard });
        }

        const setters: Record<keyof CardPaymentProcessorState, (...args: any[]) => any> = {
            card: setCard,
            cardSubmitted: setSubmitted,
        };

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

        return () => paymentProcessor.destroy();
    }, []);

    const reset = () => paymentProcessor.reset();

    const fetchPaymentToken = async () => withFetchingToken(paymentProcessor.fetchPaymentToken());
    const verifyPaymentToken = () => {
        const tokenPromise = paymentProcessor.verifyPaymentToken();
        withVerifyingToken(tokenPromise).catch(noop);
        return tokenPromise;
    };

    const processPaymentToken = async () => {
        onProcessPaymentToken?.('card');

        if (!paymentProcessor.fetchedPaymentToken) {
            await fetchPaymentToken();
        }

        try {
            return await verifyPaymentToken();
        } catch (error) {
            onProcessPaymentTokenFailed?.('card');
            reset();
            throw error;
        }
    };

    const fields = Object.keys(errors) as (keyof CardModel)[];
    const fieldsStatus: CardFieldStatus = getInitialFieldStatus();
    for (const field of fields) {
        fieldsStatus[field] = !errors[field];
    }

    return {
        fetchPaymentToken,
        fetchingToken,
        verifyPaymentToken,
        verifyingToken,
        card,
        setCardProperty: (key: keyof CardModel, value: any) => paymentProcessor.updateCardProperty(key, value),
        errors: submitted ? errors : {},
        fieldsStatus,
        submitted,
        paymentProcessor,
        processPaymentToken,
        processingToken,
        meta: {
            type: 'card',
        },
    };
};
