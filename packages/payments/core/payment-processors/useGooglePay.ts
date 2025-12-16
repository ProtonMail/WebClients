import { useRef } from 'react';

import { c } from 'ttag';

import type { PaymentIntent } from '@proton/chargebee/lib';
import useLoading from '@proton/hooks/useLoading';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { type CreatePaymentIntentGooglePayData, fetchPaymentIntentV5, getTokenStatusV5 } from '../api/api';
import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '../constants';
import { type PaymentVerificatorV5, convertPaymentIntentData } from '../createPaymentToken';
import type {
    AmountAndCurrency,
    ChargeableV5PaymentParameters,
    ChargebeeFetchedPaymentToken,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    RemoveEventListener,
} from '../interface';
import type { PaymentProcessorHook } from './interface';

export type GooglePayModalHandles = {
    onAuthorize: () => void;
    onClick: () => void;
    onFailure: (error: any) => void;
    onCancel: () => void;
    on3DSChallenge: () => void;
    onInitialize: () => void;
};

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    onChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>;
}

export interface Dependencies {
    api: Api;
    events: ChargebeeIframeEvents;
    handles: ChargebeeIframeHandles;
    googlePayModalHandles: GooglePayModalHandles | undefined;
    verifyPayment: PaymentVerificatorV5;
}

type Overrides = {
    verifyPaymentToken: () => Promise<unknown>;
};

export type GooglePayProcessorHook = Omit<PaymentProcessorHook, keyof Overrides> & {
    reset: () => void;
    initializing: boolean;
    initialize: (abortSignal: AbortSignal) => Promise<void>;
    googlePayIframeLoadedRef: React.MutableRefObject<boolean>;
} & Overrides;

export const useGooglePay = (
    { amountAndCurrency, onChargeable }: Props,
    { api, handles, events, googlePayModalHandles, verifyPayment }: Dependencies
): GooglePayProcessorHook => {
    const fetchedPaymentTokenRef = useRef<ChargebeeFetchedPaymentToken | null>(null);
    const paymentIntentRef = useRef<PaymentIntent | null>(null);
    const eventListenersRef = useRef<RemoveEventListener[]>([]);
    const googlePayIframeLoadedRef = useRef(false);
    const onChargeableRef = useRef(onChargeable);
    const chargeableTriggeredRef = useRef(false);

    // Keep the ref up to date with the latest onChargeable callback
    onChargeableRef.current = onChargeable;

    const [fetchingToken, withFetchingToken] = useLoading();
    const [initializing, withInitializing] = useLoading();

    const abort3DSVerificationRef = useRef<AbortController | null>(null);

    const fetchPaymentToken = () => {
        return withFetchingToken(async () => {
            const payload: CreatePaymentIntentGooglePayData = {
                ...amountAndCurrency,
                Payment: {
                    Type: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
                },
            };

            const { Token: PaymentToken, Status, Data: bePaymentIntentData } = await fetchPaymentIntentV5(api, payload);

            const paymentIntent = convertPaymentIntentData(bePaymentIntentData);

            fetchedPaymentTokenRef.current = {
                ...amountAndCurrency,
                PaymentToken,
                v: 5,
                chargeable: Status === PAYMENT_TOKEN_STATUS.CHARGEABLE,
                authorized: true,
                type: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
            };
            paymentIntentRef.current = paymentIntent;
        });
    };

    const verifyPaymentToken = async () => {};

    const processPaymentToken = async () => {};

    const tokenIsChargeable = (chargebeeToken: ChargebeeFetchedPaymentToken) => {
        if (chargeableTriggeredRef.current) {
            return;
        }

        chargeableTriggeredRef.current = true;

        googlePayModalHandles?.onAuthorize();

        return onChargeableRef.current?.({
            ...chargebeeToken,
            chargeable: true as const,
        });
    };

    const reset = () => {
        for (const removeEventListener of eventListenersRef.current) {
            removeEventListener();
        }
        eventListenersRef.current = [];
        fetchedPaymentTokenRef.current = null;
        paymentIntentRef.current = null;
    };

    const addListeners = (abortSignal?: AbortSignal) => {
        const removeAuthorizedListener = events.onGooglePayAuthorized(async () => {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            removeThreeDsListener?.();

            if (!fetchedPaymentTokenRef.current || !paymentIntentRef.current) {
                return;
            }

            try {
                const { Status } = await api({
                    ...getTokenStatusV5(fetchedPaymentTokenRef.current.PaymentToken),
                    signal: abortSignal,
                });

                if (Status === PAYMENT_TOKEN_STATUS.CHARGEABLE) {
                    if (abort3DSVerificationRef.current) {
                        abort3DSVerificationRef.current.abort();
                    }

                    void tokenIsChargeable(fetchedPaymentTokenRef.current);
                } else {
                    throw new Error(c('Payments.error').t`Something went wrong. Google Pay verification failed.`);
                }
            } catch (error) {
                googlePayModalHandles?.onFailure(error);
            }
        });
        eventListenersRef.current.push(removeAuthorizedListener);

        // on google pay three ds: show the Verification modal and start polling for the status.
        // it must then close itself when the token is chargeable, or when onGooglePayAuthorized is called.
        const removeThreeDsListener = events.onThreeDsChallenge(async ({ url }) => {
            if (!fetchedPaymentTokenRef.current) {
                return;
            }

            abort3DSVerificationRef.current = new AbortController();

            try {
                googlePayModalHandles?.on3DSChallenge();
                await verifyPayment({
                    token: {
                        ...fetchedPaymentTokenRef.current,
                        approvalUrl: url,
                        authorized: false,
                    },
                    v: 5,
                    events,
                    abortController: abort3DSVerificationRef.current,
                    onCancelled: () => {
                        googlePayModalHandles?.onCancel();
                    },
                    onError: (error) => {
                        googlePayModalHandles?.onFailure(error);
                    },
                    paymentMethodType: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
                    paymentMethodValue: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
                });

                removeAuthorizedListener?.();

                void tokenIsChargeable(fetchedPaymentTokenRef.current);
            } catch {}
        });
        eventListenersRef.current.push(removeThreeDsListener);

        const clickListener = events.onGooglePayClicked(() => {
            googlePayModalHandles?.onClick();
        });
        eventListenersRef.current.push(clickListener);

        const failureListener = events.onGooglePayFailure((error) => {
            googlePayModalHandles?.onFailure(error);
            reset();
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            void initialize();
        });
        eventListenersRef.current.push(failureListener);

        const cancelListener = events.onGooglePayCancelled(() => {
            googlePayModalHandles?.onCancel();
        });
        eventListenersRef.current.push(cancelListener);
    };

    const setPaymentIntent = async (abortSignal?: AbortSignal) => {
        if (!fetchedPaymentTokenRef.current) {
            throw new Error('CB google pay: No payment token fetched');
        }

        if (!paymentIntentRef.current) {
            throw new Error('CB google pay: No payment intent fetched');
        }

        addListeners(abortSignal);

        await handles.setGooglePayPaymentIntent(
            {
                paymentIntent: paymentIntentRef.current,
            },
            abortSignal
        );
    };

    const initialize = async (abortSignal?: AbortSignal) => {
        if (!googlePayIframeLoadedRef.current) {
            return;
        }

        const initGooglePayPromise = handles.initializeGooglePay();
        const fetchTokenPromise = fetchPaymentToken();

        withInitializing(async () => {
            await Promise.all([initGooglePayPromise, fetchTokenPromise]);
            await setPaymentIntent(abortSignal);
            googlePayModalHandles?.onInitialize();
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
        googlePayIframeLoadedRef,
        meta: {
            type: PAYMENT_METHOD_TYPES.GOOGLE_PAY,
        },
    };
};
