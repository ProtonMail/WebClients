import { useRef } from 'react';

import type { PaymentIntent } from '@proton/chargebee/lib/types';
import useLoading from '@proton/hooks/useLoading';
import {
    type CreatePaymentIntentApplePayData,
    type CreatePaymentIntentGooglePayData,
    type CreatePaymentIntentPaypalData,
    fetchPaymentIntentV5,
    getTokenStatusV5,
} from '@proton/payments/core/api/api';
import { isApplePayUnsupportedError } from '@proton/payments/core/chargebee-errors';
import { type PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from '@proton/payments/core/constants';
import { type PaymentVerificatorV5, convertPaymentIntentData } from '@proton/payments/core/createPaymentToken';
import type {
    AmountAndCurrency,
    ChargeableV5PaymentParameters,
    ChargebeeFetchedPaymentToken,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    RemoveEventListener,
} from '@proton/payments/core/interface';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import { type PaymentsCaptureOptions, tracePaymentError } from '@proton/payments/sentry/capture';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import noop from '@proton/utils/noop';

import { abortSignalAny } from '../client-extensions/validators/AbortSignalAny';

type WalletModalHandles = {
    onAuthorize: () => void;
    onClick: () => void;
    onFailure: (error: any) => void;
    onCancel: () => void;
    on3DSChallenge?: () => void;
    onInitialize?: () => void;
    onMountFailure?: () => void;
};

type WalletPaymentIntentData =
    CreatePaymentIntentPaypalData | CreatePaymentIntentApplePayData | CreatePaymentIntentGooglePayData;

type WalletMethodType =
    PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL | PAYMENT_METHOD_TYPES.APPLE_PAY | PAYMENT_METHOD_TYPES.GOOGLE_PAY;

type InitializeHandle = 'initializePaypal' | 'initializeApplePay' | 'initializeGooglePay';
type SetIntentHandle = 'setPaypalPaymentIntent' | 'setApplePayPaymentIntent' | 'setGooglePayPaymentIntent';

export type WalletConfig = {
    type: WalletMethodType;
    /** `Payment.Type` the backend expects, which is not always the PAYMENT_METHOD_TYPES value. */
    bePaymentType: WalletPaymentIntentData['Payment']['Type'];
    handles: { initialize: InitializeHandle; setPaymentIntent: SetIntentHandle };
    events: {
        authorized: keyof ChargebeeIframeEvents;
        failure: keyof ChargebeeIframeEvents;
        clicked: keyof ChargebeeIframeEvents;
        cancelled: keyof ChargebeeIframeEvents;
    };
    /** Start over after a failure rather than leaving the button dead. */
    reinitOnFailure?: boolean;
    /**
     * Message for when the user authorized but the token never became chargeable. Only wallets
     * that supply one route authorized-path failures to `onFailure`. A thunk so ttag resolves it in
     * the active locale rather than at module load.
     */
    getNotChargeableMessage?: () => string;
};

export interface Props {
    amountAndCurrency: AmountAndCurrency;
    onChargeable?: (data: ChargeableV5PaymentParameters) => Promise<unknown>;
}

export interface Dependencies {
    api: Api;
    events: ChargebeeIframeEvents;
    handles: ChargebeeIframeHandles;
    modalHandles: WalletModalHandles | undefined;
    /**
     * Supplying one opts the wallet into the 3DS challenge flow, and defers reporting authorization
     * until the token is known to be chargeable.
     */
    verifyPayment?: PaymentVerificatorV5;
}

type Overrides = { verifyPaymentToken: () => Promise<unknown> };

export type WalletProcessorHook = Omit<PaymentProcessorHook, keyof Overrides> & {
    reset: () => void;
    initializing: boolean;
    initialize: (abortSignal?: AbortSignal) => Promise<void>;
    iframeLoadedRef: React.MutableRefObject<boolean>;
} & Overrides;

/**
 * One hook for every Chargebee wallet button (PayPal, Apple Pay, Google Pay).
 *
 * They all share the same shape: load the plugin and fetch a payment token in parallel, arm the
 * payment intent, then wait for the iframe to report that the user authorized. What differs is
 * expressed in {@link WalletConfig}.
 */
export const useChargebeeWallet = (
    cfg: WalletConfig,
    { amountAndCurrency, onChargeable }: Props,
    { api, handles, events, modalHandles, verifyPayment }: Dependencies
): WalletProcessorHook => {
    const fetchedPaymentTokenRef = useRef<ChargebeeFetchedPaymentToken | null>(null);
    const paymentIntentRef = useRef<PaymentIntent | null>(null);
    const eventListenersRef = useRef<RemoveEventListener[]>([]);
    const iframeLoadedRef = useRef(false);
    const reportedRef = useRef(false);
    const threeDsStartedRef = useRef(false);
    // identifies the token a verification was issued for, so a superseded one cannot report back
    const attemptRef = useRef(0);
    // A new amount starts a new setup while the previous one may still be in flight. The previous one must not arm the
    // iframe or store its token, otherwise the user approves and pays the previous amount.
    const setupAbortControllerRef = useRef(new AbortController());
    // Overlapping token requests for the same user can fail at the payment provider (422, Code 2900, the generic
    // "provider unavailable" error), so they go one at a time
    const pendingTokenRequestRef = useRef<Promise<unknown>>(Promise.resolve());

    // `onAuthorize` is what dismisses the pending-verification modal, so wallets that cannot verify
    // must fire it on the iframe event — even when the token turns out not to be chargeable. A
    // verificator can still reject after the user authorized, so those wallets wait instead.
    const reportsAuthorizedOnEvent = !verifyPayment;

    const onChargeableRef = useRef(onChargeable);
    onChargeableRef.current = onChargeable;

    // listeners are registered once at initialize, but the handles are rebuilt on every render
    const modalHandlesRef = useRef(modalHandles);
    modalHandlesRef.current = modalHandles;

    const captureOptions: PaymentsCaptureOptions = {
        component: 'use-chargebee-wallet',
        featureFlag: 'PaymentProcessorsRefactor',
        tags: { paymentMethod: cfg.type },
    };

    const [fetchingToken, withFetchingToken] = useLoading();
    const [initializing, withInitializing] = useLoading();

    const requestPaymentToken = async (setupSignal?: AbortSignal) => {
        const request = pendingTokenRequestRef.current.catch(noop).then(() => {
            if (setupSignal?.aborted) {
                throw new DOMException(`Outdated ${cfg.bePaymentType} setup`, 'AbortError');
            }
            return fetchPaymentIntentV5(api, {
                ...amountAndCurrency,
                Payment: { Type: cfg.bePaymentType },
            } as WalletPaymentIntentData);
        });
        pendingTokenRequestRef.current = request;

        const { Token: PaymentToken, Status, Data: bePaymentIntentData } = await request;

        const token: ChargebeeFetchedPaymentToken = {
            ...amountAndCurrency,
            PaymentToken,
            v: 5,
            chargeable: Status === PAYMENT_TOKEN_STATUS.CHARGEABLE,
            authorized: true,
            type: cfg.type,
        };

        return { token, paymentIntent: convertPaymentIntentData(bePaymentIntentData) };
    };

    const storePaymentToken = ({ token, paymentIntent }: Awaited<ReturnType<typeof requestPaymentToken>>) => {
        attemptRef.current += 1;
        fetchedPaymentTokenRef.current = token;
        paymentIntentRef.current = paymentIntent;
    };

    const fetchPaymentToken = () =>
        withFetchingToken(async () => {
            storePaymentToken(await requestPaymentToken());
        });

    const verifyPaymentToken = async () => {};
    const processPaymentToken = async () => {};

    /**
     * Reports that the token is chargeable and that the caller should take the next action. It does
     * not move any money — the charge happens in whatever the `onChargeable` consumer calls next.
     */
    const reportChargeable = (token: ChargebeeFetchedPaymentToken) => {
        // one token is only ever good for one charge, whichever signal got here first
        if (reportedRef.current) {
            return;
        }
        reportedRef.current = true;

        if (!reportsAuthorizedOnEvent) {
            modalHandlesRef.current?.onAuthorize();
        }

        return onChargeableRef.current?.({ ...token, chargeable: true as const });
    };

    const startSetup = (abortSignal?: AbortSignal) => {
        setupAbortControllerRef.current.abort();
        setupAbortControllerRef.current = new AbortController();
        const setupSignal = setupAbortControllerRef.current.signal;
        return abortSignal ? abortSignalAny([abortSignal, setupSignal]) : setupSignal;
    };

    const reset = () => {
        setupAbortControllerRef.current.abort();
        for (const removeEventListener of eventListenersRef.current) {
            removeEventListener();
        }
        eventListenersRef.current = [];
        fetchedPaymentTokenRef.current = null;
        paymentIntentRef.current = null;
        reportedRef.current = false;
        threeDsStartedRef.current = false;
    };

    const subscribe = (name: keyof ChargebeeIframeEvents, callback: (payload?: any) => any) => {
        const removeEventListener = (events[name] as (cb: (payload?: any) => any) => RemoveEventListener)(callback);
        eventListenersRef.current.push(removeEventListener);
        return removeEventListener;
    };

    const addListeners = (abortSignal?: AbortSignal) => {
        subscribe(cfg.events.authorized, async () => {
            if (reportsAuthorizedOnEvent) {
                modalHandlesRef.current?.onAuthorize();
            }

            // Once a challenge starts, `verifyPayment` owns the outcome: it runs its own chargeability
            // check, and it needs this same event to finish. Racing it here only fights it.
            if (threeDsStartedRef.current) {
                return;
            }

            const token = fetchedPaymentTokenRef.current;
            if (!token || !paymentIntentRef.current) {
                return;
            }

            try {
                const { Status } = await api({
                    ...getTokenStatusV5(token.PaymentToken),
                    signal: abortSignal,
                });

                if (Status === PAYMENT_TOKEN_STATUS.CHARGEABLE) {
                    void reportChargeable(token);
                } else if (cfg.getNotChargeableMessage) {
                    tracePaymentError(new Error('Payment token not chargeable'), captureOptions);
                    modalHandlesRef.current?.onFailure(new Error(cfg.getNotChargeableMessage()));
                }
            } catch (error) {
                tracePaymentError(error, captureOptions);
                if (cfg.getNotChargeableMessage) {
                    modalHandlesRef.current?.onFailure(error);
                }
            }
        });

        // On a 3DS challenge: hand over to the verificator, which opens the approval tab and resolves
        // only once it has seen the token turn chargeable.
        if (verifyPayment) {
            subscribe('onThreeDsChallenge', async ({ url }: { url: string }) => {
                const token = fetchedPaymentTokenRef.current;
                // a challenge arriving after the payment is already reported would open a stray tab
                if (!token || reportedRef.current) {
                    return;
                }

                threeDsStartedRef.current = true;
                const attempt = attemptRef.current;

                try {
                    modalHandlesRef.current?.on3DSChallenge?.();
                    await verifyPayment({
                        token: { ...token, approvalUrl: url, authorized: false },
                        v: 5,
                        events,
                        onCancelled: () => modalHandlesRef.current?.onCancel(),
                        onError: (error) => modalHandlesRef.current?.onFailure(error),
                        paymentMethodType: cfg.type,
                        paymentMethodValue: cfg.type,
                    });

                    if (attempt !== attemptRef.current) {
                        return;
                    }
                    void reportChargeable(token);
                } catch {}
            });
        }

        subscribe(cfg.events.clicked, () => modalHandlesRef.current?.onClick());

        subscribe(cfg.events.failure, (error: any) => {
            modalHandlesRef.current?.onFailure(error);

            if (cfg.reinitOnFailure) {
                reset();
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                void initialize();
            }
        });

        subscribe(cfg.events.cancelled, () => modalHandlesRef.current?.onCancel());
    };

    const setPaymentIntent = async (abortSignal?: AbortSignal) => {
        if (!fetchedPaymentTokenRef.current) {
            throw new Error(`CB ${cfg.bePaymentType}: No payment token fetched`);
        }

        if (!paymentIntentRef.current) {
            throw new Error(`CB ${cfg.bePaymentType}: No payment intent fetched`);
        }

        addListeners(abortSignal);

        await handles[cfg.handles.setPaymentIntent](
            { paymentIntent: paymentIntentRef.current },
            abortSignal as AbortSignal
        );
    };

    const initialize = async (abortSignal?: AbortSignal) => {
        if (!iframeLoadedRef.current) {
            return;
        }

        const setupSignal = startSetup(abortSignal);

        const initIframePromise = handles[cfg.handles.initialize]();
        const tokenPromise = requestPaymentToken(setupSignal);
        withFetchingToken(tokenPromise).catch(noop);

        withInitializing(async () => {
            const [, fetched] = await Promise.all([initIframePromise, tokenPromise]);
            if (setupSignal.aborted) {
                return;
            }

            storePaymentToken(fetched);
            await setPaymentIntent(abortSignal);

            modalHandlesRef.current?.onInitialize?.();
        }).catch((error) => {
            if (isApplePayUnsupportedError(error)) {
                modalHandlesRef.current?.onMountFailure?.();
                return;
            }
            noop();
        });
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
        iframeLoadedRef,
        // We receive a notification that processing started from Chargebee rather than from actions of a user. Can be
        // improved in the future by implementing better synchronization of state between the main app and the iframe
        // wrapper.
        userInitiatedProcessing: false,
        meta: {
            type: cfg.type,
        },
    };
};
