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
import { isCurrencySupportedByMethod } from '@proton/payments/core/payment-methods/useCurrencyOverride';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Api } from '@proton/shared/lib/interfaces';

const ACCOUNT_HOLDER_NAME_DEBOUNCE_MS = 500;

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
    fetchPaymentToken: (abortSignal?: AbortSignal) => Promise<unknown>;
    verifyPaymentToken: () => Promise<ChargeableV5PaymentParameters>;
    processPaymentToken: () => Promise<ChargeableV5PaymentParameters>;
};

export type ChargebeeIdealProcessorHook = Omit<PaymentProcessorHook, keyof Overrides> & {
    initializing: boolean;
    initializationError: boolean;
    initialize: (abortSignal: AbortSignal) => Promise<void>;
    idealIframeLoadedRef: React.MutableRefObject<boolean>;
    accountHolderName: string;
    setAccountHolderName: (accountHolderName: string) => void;
    accountHolderNameError: string;
    accountHolderNameMissing: boolean;
    touchAccountHolderName: () => void;
    readyToPay: boolean;
} & Overrides;

export const useChargebeeIdeal = (
    { amountAndCurrency, onChargeable }: Props,
    { api, handles, events, chargebeeIdealModalHandles }: Dependencies
): ChargebeeIdealProcessorHook => {
    const idealIframeLoadedRef = useRef(false);
    const fetchedPaymentTokenRef = useRef<ChargebeeFetchedPaymentToken | null>(null);
    const paymentIntentRef = useRef<PaymentIntent | null>(null);
    const removeEventListenersRef = useRef<RemoveEventListener[]>([]);
    const resetCountRef = useRef(0);

    const modalHandlesRef = useRef(chargebeeIdealModalHandles);
    const onChargeableRef = useRef(onChargeable);

    modalHandlesRef.current = chargebeeIdealModalHandles;
    onChargeableRef.current = onChargeable;

    const [fetchingToken, withFetchingToken] = useLoading();
    const [verifyingToken] = useLoading();
    const [initializing, withInitializing] = useLoading();
    const [initializationError, setInitializationError] = useState(false);

    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountHolderNameTouched, setAccountHolderNameTouched] = useState(false);
    const [nameSentToIframe, setNameSentToIframe] = useState<string | null>(null);
    const [paymentIntentFetched, setPaymentIntentFetched] = useState(false);

    const trimmedAccountHolderName = accountHolderName.trim();
    const processingToken = fetchingToken || verifyingToken;

    const removeEventListeners = () => {
        removeEventListenersRef.current.forEach((removeEventListener) => removeEventListener());
        removeEventListenersRef.current = [];
    };

    const reset = () => {
        resetCountRef.current++;
        fetchedPaymentTokenRef.current = null;
        paymentIntentRef.current = null;
        removeEventListeners();
        setNameSentToIframe(null);
        setPaymentIntentFetched(false);
    };

    useEffect(() => {
        reset();
    }, [amountAndCurrency]);

    const mustIgnoreError = (error: any) =>
        isMessageBusResponseFailure(error) && error.error?.name === chargebeeValidationErrorName;

    const fetchPaymentToken = async (abortSignal?: AbortSignal) => {
        return withFetchingToken(async () => {
            try {
                const result = await createPaymentTokenV5Ideal(
                    { type: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL, amountAndCurrency },
                    { api, handles, events },
                    abortSignal
                );
                const { paymentIntent, ...token } = result;
                paymentIntentRef.current = paymentIntent;
                fetchedPaymentTokenRef.current = token;
                setPaymentIntentFetched(true);
            } catch (error) {
                if (mustIgnoreError(error)) {
                    return;
                }
                throw error;
            }
        });
    };

    const sendIdealPaymentIntent = async (name: string, abortSignal: AbortSignal) => {
        const paymentIntent = paymentIntentRef.current;
        if (!paymentIntent) {
            throw new Error('CB ideal: payment token not fetched');
        }

        const userName = name.trim();
        const resetCountBeforeSend = resetCountRef.current;
        await handles.setIdealPaymentIntent({ paymentIntent, userName }, abortSignal);

        if (abortSignal.aborted || resetCountBeforeSend !== resetCountRef.current) {
            return;
        }

        setInitializationError(false);
        setNameSentToIframe(userName);
    };

    useEffect(() => {
        if (!paymentIntentFetched || trimmedAccountHolderName === '' || nameSentToIframe === trimmedAccountHolderName) {
            return;
        }

        const abortController = new AbortController();
        const timeout = setTimeout(() => {
            if (!paymentIntentRef.current) {
                return;
            }

            void sendIdealPaymentIntent(trimmedAccountHolderName, abortController.signal).catch(() => {
                if (!abortController.signal.aborted) {
                    setInitializationError(true);
                }
            });
        }, ACCOUNT_HOLDER_NAME_DEBOUNCE_MS);

        return () => {
            clearTimeout(timeout);
            abortController.abort();
        };
    }, [trimmedAccountHolderName, nameSentToIframe, paymentIntentFetched]);

    const subscribeToIdealEvents = (abortSignal: AbortSignal) => {
        const token = fetchedPaymentTokenRef.current;
        if (!token) {
            throw new Error('CB ideal: payment token not fetched');
        }

        removeEventListeners();

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
    };

    const verifyPaymentToken = async (): Promise<ChargeableV5PaymentParameters> => {
        throw new Error('Not implemented');
    };

    const processPaymentToken = async (): Promise<ChargeableV5PaymentParameters> => {
        return null as any;
    };

    const initialize = async (abortSignal: AbortSignal) => {
        setInitializationError(false);

        const currencySupported = isCurrencySupportedByMethod(
            PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
            amountAndCurrency.Currency
        );

        if (!idealIframeLoadedRef.current || !currencySupported) {
            return;
        }

        return withInitializing(async () => {
            await Promise.all([handles.initializeIdeal(), fetchPaymentToken(abortSignal)]);
            subscribeToIdealEvents(abortSignal);
            await sendIdealPaymentIntent(accountHolderName, abortSignal);
        }).catch(() => {
            if (!abortSignal.aborted) {
                setInitializationError(true);
            }
        });
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
        accountHolderName,
        setAccountHolderName,
        accountHolderNameError: accountHolderNameTouched ? requiredValidator(trimmedAccountHolderName) : '',
        accountHolderNameMissing: trimmedAccountHolderName === '',
        touchAccountHolderName: () => setAccountHolderNameTouched(true),
        readyToPay: trimmedAccountHolderName !== '' && nameSentToIframe === trimmedAccountHolderName,
        userInitiatedProcessing: false,
        meta: {
            type: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
        },
    };
};
