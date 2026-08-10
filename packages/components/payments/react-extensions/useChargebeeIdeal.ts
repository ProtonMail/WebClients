import { useEffect, useRef, useState } from 'react';

import { type PaymentIntent, chargebeeValidationErrorName, isMessageBusResponseFailure } from '@proton/chargebee/lib';
import { useLoading } from '@proton/hooks';
import { getTokenStatusV5 } from '@proton/payments/core/api/api';
import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import { createPaymentTokenV5Ideal } from '@proton/payments/core/createPaymentToken';
import type {
    AmountAndCurrency,
    ChargeableV5PaymentParameters,
    ChargebeeFetchedPaymentToken,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    RemoveEventListener,
} from '@proton/payments/core/interface';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import type { Api } from '@proton/shared/lib/interfaces';

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    onChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>;
}

export interface ChargebeeIdealModalHandles {
    onAuthorize: () => void;
    onCancel: () => void;
    onClick: () => void;
    onFailure: (error: any) => void;
}

export interface Dependencies {
    api: Api;
    handles: ChargebeeIframeHandles;
    events: ChargebeeIframeEvents;
    chargebeeIdealModalHandles?: ChargebeeIdealModalHandles;
}

type Overrides = {
    fetchPaymentToken: () => Promise<unknown>;
    verifyPaymentToken: () => Promise<ChargeableV5PaymentParameters>;
    processPaymentToken: () => Promise<ChargeableV5PaymentParameters>;
};

export type ChargebeeIdealProcessorHook = Omit<PaymentProcessorHook, keyof Overrides> & {
    initializing: boolean;
    initializationError: boolean;
    initialize: (abortSignal: AbortSignal) => Promise<void>;
    idealIframeLoadedRef: React.MutableRefObject<boolean>;
} & Overrides;

export const useChargebeeIdeal = (
    { amountAndCurrency, onChargeable }: Props,
    { api, handles, events, chargebeeIdealModalHandles }: Dependencies
): ChargebeeIdealProcessorHook => {
    const idealIframeLoadedRef = useRef(false);
    const fetchedPaymentTokenRef = useRef<ChargebeeFetchedPaymentToken | null>(null);
    const paymentIntentRef = useRef<PaymentIntent | null>(null);
    const removeEventListenersRef = useRef<RemoveEventListener[]>([]);

    const modalHandlesRef = useRef(chargebeeIdealModalHandles);
    const onChargeableRef = useRef(onChargeable);

    modalHandlesRef.current = chargebeeIdealModalHandles;
    onChargeableRef.current = onChargeable;

    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken] = useLoading();
    const [initializing, withInitializing] = useLoading();
    const [initializationError, setInitializationError] = useState(false);

    const processingToken = fetchingToken || verifyingToken;

    const reset = () => {
        fetchedPaymentTokenRef.current = null;
        paymentIntentRef.current = null;
        removeEventListenersRef.current.forEach((removeEventListener) => removeEventListener());
        removeEventListenersRef.current = [];
    };

    useEffect(() => {
        reset();
    }, [amountAndCurrency]);

    const mustIgnoreError = (error: any) =>
        isMessageBusResponseFailure(error) && error.error?.name === chargebeeValidationErrorName;

    const fetchPaymentToken = async () => {
        return withFetchingToken(async () => {
            try {
                const result = await createPaymentTokenV5Ideal(
                    { type: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, amountAndCurrency },
                    { api, handles, events }
                );
                const { paymentIntent, ...token } = result;
                paymentIntentRef.current = paymentIntent;
                fetchedPaymentTokenRef.current = token;
            } catch (error) {
                if (mustIgnoreError(error)) {
                    return;
                }
                throw error;
            }
        });
    };

    const setIdealPaymentIntent = async (abortSignal: AbortSignal) => {
        const token = fetchedPaymentTokenRef.current;
        const paymentIntent = paymentIntentRef.current;
        if (!token || !paymentIntent) {
            throw new Error('CB ideal: payment token not fetched');
        }

        removeEventListenersRef.current.push(
            events.onIdealClicked(() => modalHandlesRef.current?.onClick()),
            events.onIdealCancelled(() => modalHandlesRef.current?.onCancel()),
            events.onIdealFailure((error) => modalHandlesRef.current?.onFailure(error)),
            events.onIdealAuthorized(async () => {
                modalHandlesRef.current?.onAuthorize();

                const { Status } = await api({
                    ...getTokenStatusV5(token.PaymentToken),
                    signal: abortSignal,
                });

                if (Status === PAYMENT_TOKEN_STATUS.CHARGEABLE) {
                    const chargeableToken: ChargeableV5PaymentParameters = {
                        v: 5,
                        PaymentToken: token.PaymentToken,
                        chargeable: true,
                        ...amountAndCurrency,
                        type: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
                    };
                    void onChargeableRef.current?.(chargeableToken);
                }
            })
        );

        await handles.setIdealPaymentIntent({ paymentIntent }, abortSignal);
    };

    const verifyPaymentToken = async (): Promise<ChargeableV5PaymentParameters> => {
        throw new Error('Not implemented');
    };

    const processPaymentToken = async (): Promise<ChargeableV5PaymentParameters> => {
        return null as any;
    };

    const initialize = async (abortSignal: AbortSignal) => {
        if (!idealIframeLoadedRef.current) {
            return;
        }

        return withInitializing(async () => {
            await Promise.all([handles.initializeIdeal(), fetchPaymentToken()]);
            await setIdealPaymentIntent(abortSignal);
        }).catch(() => setInitializationError(true));
    };

    return {
        fetchPaymentToken,
        fetchingToken,
        verifyPaymentToken,
        verifyingToken,
        reset,
        processPaymentToken,
        processingToken,
        initialize,
        initializing,
        initializationError,
        idealIframeLoadedRef,
        userInitiatedProcessing: false,
        meta: {
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
        },
    };
};
