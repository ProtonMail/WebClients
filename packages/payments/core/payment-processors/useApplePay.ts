import { useRef } from 'react';

import { type PaymentIntent } from '@proton/chargebee/lib';
import useLoading from '@proton/hooks/useLoading';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { type CreatePaymentIntentApplePayData, fetchPaymentIntentV5, getTokenStatusV5 } from '../api';
import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '../constants';
import { convertPaymentIntentData } from '../createPaymentToken';
import type {
    AmountAndCurrency,
    ChargeableV5PaymentParameters,
    ChargebeeFetchedPaymentToken,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    ForceEnableChargebee,
    RemoveEventListener,
} from '../interface';
import type { PaymentProcessorHook } from './interface';

export type ApplePayModalHandles = {
    onAuthorize: () => void;
    onClick: () => void;
    onFailure: (error: any) => void;
    onCancel: () => void;
};

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    onChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>;
}

export interface Dependencies {
    api: Api;
    events: ChargebeeIframeEvents;
    handles: ChargebeeIframeHandles;
    forceEnableChargebee: ForceEnableChargebee;
    applePayModalHandles: ApplePayModalHandles | undefined;
}

type Overrides = {
    verifyPaymentToken: () => Promise<unknown>;
};

export type ApplePayProcessorHook = Omit<PaymentProcessorHook, keyof Overrides> & {
    reset: () => void;
    initializing: boolean;
    initialize: (abortSignal: AbortSignal) => Promise<void>;
    applePayIframeLoadedRef: React.MutableRefObject<boolean>;
} & Overrides;

export const useApplePay = (
    { amountAndCurrency, onChargeable }: Props,
    { api, handles, events, applePayModalHandles, forceEnableChargebee }: Dependencies
): ApplePayProcessorHook => {
    const fetchedPaymentTokenRef = useRef<ChargebeeFetchedPaymentToken | null>(null);
    const paymentIntentRef = useRef<PaymentIntent | null>(null);
    const eventListenersRef = useRef<RemoveEventListener[]>([]);
    const applePayIframeLoadedRef = useRef(false);
    const onChargeableRef = useRef(onChargeable);

    // Keep the ref up to date with the latest onChargeable callback
    onChargeableRef.current = onChargeable;

    const [fetchingToken, withFetchingToken] = useLoading();
    const [initializing, withInitializing] = useLoading();

    const fetchPaymentToken = () => {
        return withFetchingToken(async () => {
            const payload: CreatePaymentIntentApplePayData = {
                ...amountAndCurrency,
                Payment: {
                    Type: PAYMENT_METHOD_TYPES.APPLE_PAY,
                },
            };

            const { Token: PaymentToken, Status, Data: bePaymentIntentData } = await fetchPaymentIntentV5(api, payload);
            forceEnableChargebee();

            const paymentIntent = convertPaymentIntentData(bePaymentIntentData);

            fetchedPaymentTokenRef.current = {
                ...amountAndCurrency,
                PaymentToken,
                v: 5,
                chargeable: Status === PAYMENT_TOKEN_STATUS.CHARGEABLE,
                authorized: true,
                type: PAYMENT_METHOD_TYPES.APPLE_PAY,
            };
            paymentIntentRef.current = paymentIntent;
        });
    };

    const verifyPaymentToken = async () => {};
    const processPaymentToken = async () => {};

    const setPaymentIntent = async (abortSignal: AbortSignal) => {
        if (!fetchedPaymentTokenRef.current) {
            throw new Error('CB apple pay: No payment token fetched');
        }

        if (!paymentIntentRef.current) {
            throw new Error('CB apple pay: No payment intent fetched');
        }

        const authorizedListener = events.onApplePayAuthorized(async () => {
            applePayModalHandles?.onAuthorize();

            if (!fetchedPaymentTokenRef.current || !paymentIntentRef.current) {
                return;
            }

            const { Status } = await api({
                ...getTokenStatusV5(fetchedPaymentTokenRef.current.PaymentToken),
                signal: abortSignal,
            });

            if (Status === PAYMENT_TOKEN_STATUS.CHARGEABLE) {
                const token = {
                    ...fetchedPaymentTokenRef.current,
                    chargeable: true as const,
                };
                void onChargeableRef.current?.(token);
            }
        });
        eventListenersRef.current.push(authorizedListener);

        const clickListener = events.onApplePayClicked(() => {
            applePayModalHandles?.onClick();
        });
        eventListenersRef.current.push(clickListener);

        const failureListener = events.onApplePayFailure((error) => {
            applePayModalHandles?.onFailure(error);
        });
        eventListenersRef.current.push(failureListener);

        const cancelListener = events.onApplePayCancelled(() => {
            applePayModalHandles?.onCancel();
        });
        eventListenersRef.current.push(cancelListener);

        await handles.setApplePayPaymentIntent(
            {
                paymentIntent: paymentIntentRef.current,
            },
            abortSignal
        );
    };

    const reset = () => {
        for (const removeEventListener of eventListenersRef.current) {
            removeEventListener();
        }
        eventListenersRef.current = [];
        fetchedPaymentTokenRef.current = null;
        paymentIntentRef.current = null;
    };

    const initialize = async (abortSignal: AbortSignal) => {
        if (!applePayIframeLoadedRef.current) {
            return;
        }

        const initApplePayPromise = handles.initializeApplePay();
        const fetchTokenPromise = fetchPaymentToken();

        withInitializing(async () => {
            await Promise.all([initApplePayPromise, fetchTokenPromise]);
            await setPaymentIntent(abortSignal);
        }).catch(noop);
    };

    return {
        fetchPaymentToken,
        verifyPaymentToken,
        processPaymentToken,
        verifyingToken: false,
        processingToken: fetchingToken,
        reset,
        initializing,
        initialize,
        fetchingToken,
        applePayIframeLoadedRef,
        meta: {
            type: PAYMENT_METHOD_TYPES.APPLE_PAY,
        },
    };
};
