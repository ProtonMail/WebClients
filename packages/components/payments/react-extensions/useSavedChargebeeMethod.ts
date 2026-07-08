import { useEffect, useRef } from 'react';

import { useLoading } from '@proton/hooks';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PaymentVerificatorV5 } from '@proton/payments/core/createPaymentToken';
import type {
    AmountAndCurrency,
    ChargeablePaymentParameters,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    ExistingPaymentMethod,
    PaymentMethodType,
    PlainPaymentMethodType,
    SavedPaymentMethod,
} from '@proton/payments/core/interface';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import { SavedChargebeePaymentProcessor } from '@proton/payments/core/payment-processors/savedChargebeePayment';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    savedMethod?: SavedPaymentMethod;
    onChargeable: (data: ChargeablePaymentParameters, paymentMethodId: ExistingPaymentMethod) => Promise<unknown>;
    onBeforeSepaPayment?: () => Promise<boolean>;
    onDeclined: ({
        selectedMethodType,
        selectedMethodValue,
    }: {
        selectedMethodType: PlainPaymentMethodType;
        selectedMethodValue: PaymentMethodType;
    }) => void;
}

export interface Dependencies {
    verifyPayment: PaymentVerificatorV5;
    api: Api;
    handles: ChargebeeIframeHandles;
    events: ChargebeeIframeEvents;
}

interface SavedChargebeeMethodProcessorHook extends PaymentProcessorHook {
    paymentProcessor?: SavedChargebeePaymentProcessor;
}

export const useSavedChargebeeMethod = (
    { amountAndCurrency, savedMethod, onChargeable, onBeforeSepaPayment, onDeclined }: Props,
    { verifyPayment, api, handles, events }: Dependencies
): SavedChargebeeMethodProcessorHook => {
    const paymentProcessorRef = useRef<SavedChargebeePaymentProcessor | undefined>(undefined);
    if (!paymentProcessorRef.current && savedMethod) {
        paymentProcessorRef.current = new SavedChargebeePaymentProcessor(
            verifyPayment,
            api,
            handles,
            events,
            amountAndCurrency,
            savedMethod,
            (chargeablePaymentParameters: ChargeablePaymentParameters) =>
                onChargeable(chargeablePaymentParameters, savedMethod.ID),
            () =>
                onDeclined({
                    selectedMethodType: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                    selectedMethodValue: savedMethod.ID,
                })
        );
    }

    const paymentProcessor = paymentProcessorRef.current;

    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken, withVerifyingToken] = useLoading();
    const processingToken = fetchingToken || verifyingToken;
    const [userInitiatedProcessing, withUserInitiatiatedProcessing] = useLoading();

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
    const processPaymentToken = () => {
        return withUserInitiatiatedProcessing(async () => {
            if (!paymentProcessor?.fetchedPaymentToken) {
                await fetchPaymentToken();
            }

            try {
                return await verifyPaymentToken();
            } catch (error) {
                reset();
                throw error;
            }
        });
    };

    return {
        fetchPaymentToken,
        fetchingToken,
        verifyPaymentToken,
        verifyingToken,
        processPaymentToken,
        processingToken,
        paymentProcessor,
        reset,
        userInitiatedProcessing,
        meta: {
            type: 'saved-chargebee',
            data: savedMethod,
        },
    };
};
