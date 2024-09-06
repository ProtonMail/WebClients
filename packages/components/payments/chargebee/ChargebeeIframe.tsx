import { type RefObject, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import {
    type CardFormRenderMode,
    type CbCardConfig,
    type CbIframeConfig,
    type ChargebeeCssVariable,
    type ChargebeeSavedCardAuthorizationSuccess,
    type ChargebeeSubmitEventPayload,
    type ChargebeeVerifySavedCardEventPayload,
    type PaymentIntent,
    type PaypalAuthorizedPayload,
    type SetPaypalPaymentIntentPayload,
    type ThreeDsChallengePayload,
    type UpdateFieldsPayload,
    chargebeeCssVariables,
    isPaypalCancelledMessage,
    isPaypalClickedMessage,
    isPaypalFailedMessage,
    isSavedCardVerificationFailureMessage,
    isSavedCardVerificationSuccessMessage,
    isThreeDsChallengeMessage,
    isThreeDsFailedMessage,
    isThreeDsSuccessMessage,
    isUnhandledErrorMessage,
    paypalAuthorizedMessageType,
} from '@proton/chargebee/lib';
import { ModalTwo, ModalTwoContent, useModalState } from '@proton/components/components';
import { useApi, useNotifications } from '@proton/components/hooks';
import { type ChargebeeCardProcessorHook } from '@proton/components/payments/react-extensions/useChargebeeCard';
import { type ChargebeePaypalProcessorHook } from '@proton/components/payments/react-extensions/useChargebeePaypal';
import {
    type GetChargebeeConfigurationResponse,
    getChargebeeConfiguration,
    getPaymentsVersion,
} from '@proton/shared/lib/api/payments';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getApiSubdomainUrl } from '@proton/shared/lib/helpers/url';
import { getSentryError } from '@proton/shared/lib/keys';

import { type ThemeCode } from '../client-extensions';
import { useChargebeeContext } from '../client-extensions/useChargebeeContext';
import {
    type ChargebeeIframeEvents,
    type ChargebeeIframeHandles,
    type InitializeCreditCardOptions,
    type RemoveEventListener,
} from '../core';

/**
 * Small helper to identify the messages sent to iframe.
 * Flow: we send the message with correlation ID X to the iframe;
 * iframe responses to this message by sending another one,
 * iframe re-uses the same correlationId in the response message.
 * It might be helpful in case of concurrency problems.
 */
export const { correlation, reset: resetCorrelation } = (() => {
    let id = 0;
    const reset = () => (id = 0);

    return {
        correlation: () => ++id,
        reset,
    };
})();

const correlationMapper: Record<string, string> = {};
function getLatestCorrelationIdByType(type: string) {
    return correlationMapper[type] ?? '';
}
function setLatestCorrelationIndexByType(type: string, id: string) {
    correlationMapper[type] = id;
}

export const parseEvent = (data: any) => {
    let props;
    try {
        props = JSON.parse(data);
    } catch (error) {
        props = {};
    }
    return props;
};

export function sendMessageToIframe(iframeRef: RefObject<HTMLIFrameElement>, targetOrigin: string, message: any) {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(message), targetOrigin);
}

export function listenToIframeEvents(
    iframeRef: RefObject<HTMLIFrameElement>,
    callback: (e: MessageEvent<any>) => void
): RemoveEventListener {
    const listener = (e: MessageEvent<any>) => {
        if (e.source !== iframeRef.current?.contentWindow) {
            return;
        }

        callback(e);
    };

    window.addEventListener('message', listener);

    return () => {
        window.removeEventListener('message', listener);
    };
}

type IframeActionOptions = {
    timeout?: number;
};

export const TIMEOUT_EXCEEDED_ERROR_TEXT = c('Payments').t`Timeout exceeded`;

export function iframeAction<T>(
    type: string,
    payload: object,
    iframeRef: RefObject<HTMLIFrameElement>,
    targetOrigin: string,
    signal?: AbortSignal,
    options?: IframeActionOptions
): Promise<T> {
    const correlationIndex = correlation();

    const correlationId = `id-${correlationIndex}`;
    setLatestCorrelationIndexByType(type, correlationId);

    let eventListenerActive = true;
    let timeoutRef: any;

    const result = new Promise<T>((resolve, reject) => {
        function handleResponse(e: MessageEvent<any>) {
            if (!eventListenerActive) {
                return;
            }

            const event = parseEvent(e.data);

            if (event.type !== `${type}-response` || event.correlationId !== correlationId) {
                return;
            }

            if (event.status === 'success') {
                resolve(event);
            } else if (event.status === 'failure') {
                reject(event);
            }

            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            clearEventListener(true);
        }

        function clearEventListener(silent = false) {
            if (!eventListenerActive || signal?.aborted) {
                return;
            }

            eventListenerActive = false;
            clearTimeout(timeoutRef);
            window.removeEventListener('message', handleResponse);

            if (silent) {
                return;
            }

            reject({
                type: `${type}-response`,
                correlationId,
                status: 'failure',
                error: TIMEOUT_EXCEEDED_ERROR_TEXT,
            });
        }

        window.addEventListener('message', handleResponse);
        signal?.addEventListener('abort', () => clearEventListener(true));

        const timeout = options?.timeout ?? 20000;
        timeoutRef = setTimeout(() => clearEventListener(false), timeout);
    });

    sendMessageToIframe(iframeRef, targetOrigin, {
        type,
        correlationId,
        ...payload,
    });

    return result;
}

function getChargebeeErrorCode(error: any) {
    return error?.error?.code;
}

function getErrorMessageByCode(errorCode: string): string | undefined {
    switch (errorCode) {
        case 'card_declined':
            return c('Payments.Error')
                .t`Your card was declined. Please try a different card or contact your bank to authorize the charge.`;

        case 'payment_intent_authentication_failure':
        case 'payment_authentication_failed':
            return c('Payments.Error')
                .t`We are unable to authenticate your payment method. Please choose a different payment method or try again.`;

        default:
            return undefined;
    }
}

function getErrorMessage(error: any) {
    return getErrorMessageByCode(getChargebeeErrorCode(error));
}

export function getChargebeeErrorMessage(error: any) {
    const errorMessage = getErrorMessage(error);

    const defaultError = c('Payments.Error').t`Something went wrong. Please try again later.`;

    // We are using || instead of ?? because the error might be an empty string, and we want to skip it in this case
    // It's better to show some error than an empty string
    return (
        errorMessage ||
        error?.displayMessage ||
        error?.error?.displayMessage ||
        error?.message ||
        error?.error?.message ||
        defaultError
    );
}

type ChargebeeIframeProps = React.IframeHTMLAttributes<HTMLIFrameElement> & {
    type: 'card' | 'paypal' | 'saved-card';
    iframeHandles: CbIframeHandles;
    chargebeeCard?: ChargebeeCardProcessorHook;
    chargebeePaypal?: ChargebeePaypalProcessorHook;
    onInitialized?: () => void;
    isNarrow?: boolean;
    themeCode?: ThemeCode;
};

interface ChargebeeConfiguration {
    site: string;
    publishableKey: string;
    domain: string;
}

export function useChargebeeHandles(
    iframeRef: RefObject<HTMLIFrameElement>,
    targetOrigin: string
): ChargebeeIframeHandles {
    const chargebeeConfigurationRef = useRef<ChargebeeConfiguration | null>(null);
    const api = useApi();
    const { createNotification } = useNotifications();

    const chargebeeConfigurationAbortControllerRef = useRef<AbortController>(new AbortController());
    const abortedRef = useRef(false);

    const signal = chargebeeConfigurationAbortControllerRef.current.signal;

    useEffect(() => {
        signal.addEventListener('abort', () => {
            abortedRef.current = true;
        });

        return () => chargebeeConfigurationAbortControllerRef.current?.abort();
    }, []);

    const getCssVariables = (): Record<ChargebeeCssVariable, string> => {
        const style = getComputedStyle(iframeRef.current ?? document.documentElement);

        return chargebeeCssVariables.reduce(
            (acc, prop) => {
                acc[prop] = style.getPropertyValue(prop);
                return acc;
            },
            {} as Record<ChargebeeCssVariable, string>
        );
    };

    const getChargebeeCardTranslations = (): CbCardConfig['translations'] => {
        return {
            cardNumberPlaceholder: c('Payments').t`Card number`,
            cardExpiryPlaceholder: c('Payments').t`MM/YY`,
            cardCvcPlaceholder: c('Payments').t`CVC`,
            invalidCardNumberMessage: c('Payments.Error').t`Invalid card number`,
            invalidCardExpiryMessage: c('Payments.Error').t`Invalid expiration date`,
            invalidCardCvcMessage: c('Payments.Error').t`Invalid security code`,
        };
    };

    const getConfig = async (): Promise<ChargebeeConfiguration> => {
        if (chargebeeConfigurationRef.current) {
            return chargebeeConfigurationRef.current;
        }

        const response = await api<GetChargebeeConfigurationResponse>(getChargebeeConfiguration());
        chargebeeConfigurationRef.current = {
            site: response.Site,
            publishableKey: response.PublishableKey,
            domain: response.Domain,
        };
        return chargebeeConfigurationRef.current;
    };

    return {
        submitCreditCard: async (payload: ChargebeeSubmitEventPayload) => {
            try {
                return await iframeAction('chargebee-submit', payload, iframeRef, targetOrigin, signal, {
                    timeout: 600000,
                });
            } catch (error) {
                const errorMessage = getChargebeeErrorMessage(error);

                createNotification({
                    type: 'error',
                    text: errorMessage,
                });
                throw error;
            }
        },
        initializeCreditCard: async ({ isNarrow }: InitializeCreditCardOptions) => {
            const chargebeeInstanceConfig = await getConfig();

            const config: CbIframeConfig = {
                paymentMethodType: 'card',
                renderMode: isNarrow ? 'two-line' : 'one-line',
                cssVariables: getCssVariables(),
                translations: getChargebeeCardTranslations(),
                ...chargebeeInstanceConfig,
            };

            return iframeAction('set-configuration', config, iframeRef, targetOrigin, signal);
        },
        initializeSavedCreditCard: async () => {
            const chargebeeInstanceConfig = await getConfig();
            const config: CbIframeConfig = {
                paymentMethodType: 'saved-card',
                ...chargebeeInstanceConfig,
            };

            return iframeAction('set-configuration', config, iframeRef, targetOrigin, signal);
        },
        validateSavedCreditCard: async (payload: ChargebeeVerifySavedCardEventPayload) => {
            try {
                return await iframeAction('chargebee-verify-saved-card', payload, iframeRef, targetOrigin, signal, {
                    timeout: 600000,
                });
            } catch (error) {
                const errorMessage = getChargebeeErrorMessage(error);

                createNotification({
                    type: 'error',
                    text: errorMessage,
                });

                throw error;
            }
        },
        initializePaypal: async () => {
            const chargebeeInstanceConfig = await getConfig();

            const config: CbIframeConfig = {
                paymentMethodType: 'paypal',
                ...chargebeeInstanceConfig,
            };

            return iframeAction('set-configuration', config, iframeRef, targetOrigin, signal);
        },
        setPaypalPaymentIntent: async (payload: SetPaypalPaymentIntentPayload, abortSignal: AbortSignal) => {
            const setPaypalPaymentIntentActionType = 'set-paypal-payment-intent';
            try {
                return await iframeAction(
                    setPaypalPaymentIntentActionType,
                    payload,
                    iframeRef,
                    targetOrigin,
                    abortSignal
                );
            } catch (error: any) {
                // make sure that only the latest error is handled, and all others are ignored
                if (error.correlationId === getLatestCorrelationIdByType(setPaypalPaymentIntentActionType)) {
                    const errorMessage = getChargebeeErrorMessage(error);
                    createNotification({
                        type: 'error',
                        text: errorMessage,
                    });
                }
                throw error;
            }
        },
        getHeight: () => iframeAction('get-height', {}, iframeRef, targetOrigin, signal),
        getBin: () => iframeAction('get-bin', {}, iframeRef, targetOrigin, signal),
        validateCardForm: () => iframeAction('validate-form', {}, iframeRef, targetOrigin, signal),
        changeRenderMode: (renderMode: CardFormRenderMode) =>
            iframeAction('change-render-mode', { renderMode }, iframeRef, targetOrigin, signal),
        updateFields: () => {
            const payload: UpdateFieldsPayload = {
                cssVariables: getCssVariables(),
            };

            return iframeAction('update-fields', payload, iframeRef, targetOrigin, signal);
        },
    };
}

export type CbIframeHandles = {
    handles: ChargebeeIframeHandles;
    events: ChargebeeIframeEvents;
    iframeRef: RefObject<HTMLIFrameElement>;
    iframeConfigured: boolean;
    iframeSrc: string;
};

export function getIframeUrl() {
    return getApiSubdomainUrl('/payments/v5/forms/cards', window.location.origin);
}

export const useCbIframe = (): CbIframeHandles => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const [iframeConfigured, setIframeConfigured] = useState(false);

    const chargebeeContext = useChargebeeContext();

    const markConfigured = <T,>(promise: Promise<T>) =>
        promise.then((result) => {
            setIframeConfigured(true);
            return result;
        });

    const iframeUrl = getIframeUrl();
    const iframeSrc = iframeUrl.toString();
    const targetOrigin = iframeUrl.origin;

    const handlesBase: ChargebeeIframeHandles = useChargebeeHandles(iframeRef, targetOrigin);

    const handles = {
        ...handlesBase,
        initializeCreditCard: (options: InitializeCreditCardOptions) =>
            markConfigured(handlesBase.initializeCreditCard(options)),
        initializePaypal: () => markConfigured(handlesBase.initializePaypal()),
        initializeSavedCreditCard: () => markConfigured(handlesBase.initializeSavedCreditCard()),
    };

    const events: ChargebeeIframeEvents = {
        onPaypalAuthorized: (callback: (payload: PaypalAuthorizedPayload) => any) =>
            listenToIframeEvents(iframeRef, (e) => {
                const payload = parseEvent(e.data);
                if (payload.type === paypalAuthorizedMessageType) {
                    callback(payload.data);
                }
            }),
        onPaypalFailure: (callback: (error: any) => any) =>
            listenToIframeEvents(iframeRef, (e) => {
                const payload = parseEvent(e.data);
                if (isPaypalFailedMessage(payload)) {
                    callback(payload.error);
                }
            }),
        onPaypalClicked: (callback: () => any) =>
            listenToIframeEvents(iframeRef, (e) => {
                const payload = parseEvent(e.data);
                if (isPaypalClickedMessage(payload)) {
                    callback();
                }
            }),
        onPaypalCancelled: (callback: () => any) =>
            listenToIframeEvents(iframeRef, (e) => {
                const payload = parseEvent(e.data);
                if (isPaypalCancelledMessage(payload)) {
                    callback();
                }
            }),
        onThreeDsChallenge: (callback: (payload: ThreeDsChallengePayload) => any) =>
            listenToIframeEvents(iframeRef, (e) => {
                const payload = parseEvent(e.data);
                if (isThreeDsChallengeMessage(payload)) {
                    callback(payload.data);
                }
            }),
        onThreeDsSuccess: (callback: (payload: PaymentIntent) => any) =>
            listenToIframeEvents(iframeRef, (e) => {
                const payload = parseEvent(e.data);
                if (isThreeDsSuccessMessage(payload)) {
                    callback(payload.data);
                }
            }),
        onThreeDsFailure: (callback: (error: any) => any) =>
            listenToIframeEvents(iframeRef, (e) => {
                const payload = parseEvent(e.data);
                if (isThreeDsFailedMessage(payload)) {
                    callback(payload.error);
                }
            }),
        onCardVeririfcation3dsChallenge: (callback: (payload: ThreeDsChallengePayload) => any) =>
            listenToIframeEvents(iframeRef, (e) => {
                const payload = parseEvent(e.data);
                if (isThreeDsChallengeMessage(payload)) {
                    callback(payload.data);
                }
            }),
        onCardVeririfcationSuccess: (callback: (payload: ChargebeeSavedCardAuthorizationSuccess) => any) =>
            listenToIframeEvents(iframeRef, (e) => {
                const payload = parseEvent(e.data);
                if (isSavedCardVerificationSuccessMessage(payload)) {
                    callback(payload.data);
                }
            }),
        onCardVeririfcationFailure: (callback: (error: any) => any) =>
            listenToIframeEvents(iframeRef, (e) => {
                const payload = parseEvent(e.data);
                if (isSavedCardVerificationFailureMessage(payload)) {
                    callback(payload.error);
                }
            }),
        onUnhandledError: (callback: (error: any, rawError: any, messagePayload: any, checkpoints: any[]) => any) =>
            listenToIframeEvents(iframeRef, (e) => {
                const payload = parseEvent(e.data);
                if (isUnhandledErrorMessage(payload)) {
                    const error = payload.error;
                    const reconstructedError = new Error(error?.message);
                    reconstructedError.stack = error?.stack;
                    reconstructedError.name = error?.name;
                    callback(reconstructedError, error, payload, error?.checkpoints);
                }
            }),
    };

    useEffect(() => {
        return events.onUnhandledError((e, rawError, messagePayload, checkpoints) => {
            const error = getSentryError(e);
            if (error) {
                const context = {
                    paymentsVersion: getPaymentsVersion(),
                    chargebeeEnabled: chargebeeContext.enableChargebeeRef.current,
                };

                captureMessage('Payments: Unhandled Chargebee error', {
                    level: 'error',
                    extra: { error, context, rawError, messagePayload, checkpoints },
                });
            }
        });
    }, []);

    return { iframeRef, handles, iframeConfigured, events, iframeSrc };
};

const ThreeDsModal = ({ url, ...rest }: any) => {
    return (
        <ModalTwo {...rest} disableCloseOnEscape={true} size="large">
            <ModalTwoContent>
                <iframe src={url} title="3ds challenge" />
            </ModalTwoContent>
        </ModalTwo>
    );
};

const useThreeDsChallenge = (iframe = false) => {
    const [modalProps, open, showModal] = useModalState();
    const [url, setUrl] = useState<string>('');

    return {
        renderChallenge: (url: string) => {
            if (iframe) {
                setUrl(url);
                open(true);
                return;
            }

            window.open(url, '_blank');
        },
        showModal,
        modalProps: {
            ...modalProps,
            url,
        },
    };
};

function getInitialHeight(type: 'card' | 'paypal' | 'saved-card'): number {
    const initialPaypalHeight = 52;
    const initialSavedCardHeight = 0;
    const initialCardHeight = 300;

    if (type === 'paypal') {
        return initialPaypalHeight;
    }
    if (type === 'saved-card') {
        return initialSavedCardHeight;
    }
    return initialCardHeight;
}

export const ChargebeeIframe = ({
    type,
    iframeHandles,
    chargebeeCard,
    chargebeePaypal,
    onInitialized,
    isNarrow,
    themeCode,
    ...rest
}: ChargebeeIframeProps) => {
    const [initialized, setInitialized] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const loadingTimeoutRef = useRef<any>(null);

    useEffect(() => {
        return () => {
            if (type === 'paypal' && chargebeePaypal) {
                chargebeePaypal.paypalIframeLoadedRef.current = false;
            }
        };
    }, []);

    const iframeRef = iframeHandles.iframeRef;

    const updateHeight = async () => {
        if (!iframeRef.current) {
            return;
        }

        const result = await iframeHandles.handles.getHeight();

        // We need to check that the iframe ref still exists because of the async operation before that.
        // Sometimes the iframe gets destroyed before the async operation is finished.
        if (!!iframeRef.current && result.status === 'success' && type === 'card') {
            const height = result.data.height;
            iframeRef.current.style.height = `${height}px`;
        }
    };

    useEffect(() => {
        if (isNarrow === undefined || !initialized) {
            return;
        }

        async function handleRenderModeChange() {
            await iframeHandles.handles.changeRenderMode(isNarrow ? 'two-line' : 'one-line');
            await updateHeight();
        }

        void handleRenderModeChange();
    }, [isNarrow]);

    const threeDs = useThreeDsChallenge(false);

    const onLoad = async () => {
        clearTimeout(loadingTimeoutRef.current);

        // initialization of paypal is called in the facade, and others are called here, at least for now
        if (type === 'card') {
            await iframeHandles.handles.initializeCreditCard({ isNarrow: !!isNarrow });
        } else if (type === 'saved-card') {
            await iframeHandles.handles.initializeSavedCreditCard();
        } else if (type === 'paypal' && chargebeePaypal) {
            chargebeePaypal.paypalIframeLoadedRef.current = true;
            abortRef.current = new AbortController();
            await chargebeePaypal.initialize(abortRef.current.signal);
        }

        if (!iframeRef.current) {
            return;
        }
        await updateHeight();

        onInitialized?.();
        setInitialized(true);
    };

    useEffect(() => {
        if (!themeCode) {
            return;
        }

        const run = async () => {
            if (!initialized || type !== 'card') {
                return;
            }

            await iframeHandles.handles.updateFields();
        };

        void run();
    }, [themeCode]);

    useEffect(
        () => () => {
            abortRef.current?.abort();
            abortRef.current = null;
            chargebeeCard?.reset();
            chargebeePaypal?.reset();
        },
        []
    );

    useEffect(() => {
        loadingTimeoutRef.current = setTimeout(() => {
            if (!initialized) {
                captureMessage('Payments: Chargebee iframe not loaded', {
                    level: 'error',
                    extra: { type },
                });
            }
        }, 20000);

        return () => clearTimeout(loadingTimeoutRef.current);
    }, []);

    // The iframe document body has a margin of 8px by default. We don't remove it from within, because this
    // additional space is used to display the borders and other elements.
    // The negative margin is used to compensate for the extra space and for the iframe to fit perfectly.
    const margin = -8;

    const initialHeight = getInitialHeight(type);

    return (
        <div style={{ margin }}>
            <iframe
                src={iframeHandles.iframeSrc}
                ref={iframeRef}
                height={initialHeight}
                width="100%"
                title="Credit card form"
                frameBorder="0"
                onLoad={onLoad}
                data-testid="chargebee-iframe"
                {...rest}
            ></iframe>
            {threeDs.showModal && <ThreeDsModal {...threeDs.modalProps} />}
        </div>
    );
};
