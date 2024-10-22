import { useEffect, useRef } from 'react';

import { useLoading } from '@proton/hooks';
import {
    type AmountAndCurrency,
    type ChargeablePaymentParameters,
    type ChargebeeIframeEvents,
    type ChargebeeIframeHandles,
    type ExistingPaymentMethod,
    PAYMENT_METHOD_TYPES,
    type PaymentVerificatorV5,
    SavedChargebeePaymentProcessor,
    type SavedPaymentMethod,
    type SavedPaymentMethodExternal,
    type SavedPaymentMethodInternal,
} from '@proton/payments';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { PaymentProcessorHook, PaymentProcessorType } from './interface';

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    savedMethod?: SavedPaymentMethodExternal | SavedPaymentMethodInternal | SavedPaymentMethod;
    onChargeable: (data: ChargeablePaymentParameters, paymentMethodId: ExistingPaymentMethod) => Promise<unknown>;
    onProcessPaymentToken?: (paymentMethodType: PaymentProcessorType) => void;
    onProcessPaymentTokenFailed?: (paymentMethodType: PaymentProcessorType) => void;
    onBeforeSepaPayment?: () => Promise<boolean>;
}

export interface Dependencies {
    verifyPayment: PaymentVerificatorV5;
    api: Api;
    handles: ChargebeeIframeHandles;
    events: ChargebeeIframeEvents;
}

export interface SavedChargebeeMethodProcessorHook extends PaymentProcessorHook {
    paymentProcessor?: SavedChargebeePaymentProcessor;
}

export const useSavedChargebeeMethod = (
    {
        amountAndCurrency,
        savedMethod,
        onChargeable,
        onProcessPaymentToken,
        onProcessPaymentTokenFailed,
        onBeforeSepaPayment,
    }: Props,
    { verifyPayment, api, handles, events }: Dependencies
): SavedChargebeeMethodProcessorHook => {
    const paymentProcessorRef = useRef<SavedChargebeePaymentProcessor>();
    if (!paymentProcessorRef.current && savedMethod) {
        paymentProcessorRef.current = new SavedChargebeePaymentProcessor(
            verifyPayment,
            api,
            handles,
            events,
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

    const fetchPaymentToken = () => {
        return withFetchingToken(async () => {
            if (onBeforeSepaPayment && savedMethod?.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT) {
                const result = await onBeforeSepaPayment();
                if (!result) {
                    return;
                }
            }

            return paymentProcessor?.fetchPaymentToken();
        });
    };
    const verifyPaymentToken = () => {
        const tokenPromise = paymentProcessor?.verifyPaymentToken();
        if (!tokenPromise) {
            throw new Error('There is no saved method to verify');
        }

        withVerifyingToken(tokenPromise).catch(noop);
        return tokenPromise;
    };
    const processPaymentToken = async () => {
        onProcessPaymentToken?.('saved-chargebee');

        if (!paymentProcessor?.fetchedPaymentToken) {
            await fetchPaymentToken();
        }

        try {
            return await verifyPaymentToken();
        } catch (error) {
            onProcessPaymentTokenFailed?.('saved-chargebee');
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
            type: 'saved-chargebee',
            data: savedMethod,
        },
    };
};
