import { getTokenStatusV4, getTokenStatusV5 } from '@proton/shared/lib/api/payments';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getHostname } from '@proton/shared/lib/helpers/url';
import { type Api } from '@proton/shared/lib/interfaces';

import { PAYMENT_TOKEN_STATUS } from './constants';
import type {
    ChargebeeFetchedPaymentToken,
    ChargebeeIframeEvents,
    PaymentTokenResult,
    RemoveEventListener,
} from './interface';

const { STATUS_PENDING, STATUS_CHARGEABLE, STATUS_FAILED, STATUS_CONSUMED, STATUS_NOT_SUPPORTED } =
    PAYMENT_TOKEN_STATUS;

const DELAY_PULLING = 5000;
const DELAY_LISTENING = 1000;

export interface EnsureTokenChargeableTranslations {
    processAbortedError: string;
    paymentProcessCanceledError: string;
    paymentProcessFailedError: string;
    paymentProcessConsumedError: string;
    paymentProcessNotSupportedError: string;
    unknownPaymentTokenStatusError: string;
    tabClosedError: string;
}

/**
 * Recursive function to check token status
 */
const pull = async ({
    timer = 0,
    Token,
    api,
    signal,
    translations,
}: {
    timer?: number;
    Token: string;
    api: Api;
    signal: AbortSignal;
    translations: EnsureTokenChargeableTranslations;
}): Promise<any> => {
    if (signal.aborted) {
        throw new Error(translations.processAbortedError);
    }

    if (timer > DELAY_PULLING * 30) {
        throw new Error(translations.paymentProcessCanceledError);
    }

    const { Status } = await api({ ...getTokenStatusV4(Token), signal });

    if (Status === STATUS_FAILED) {
        throw new Error(translations.paymentProcessFailedError);
    }

    if (Status === STATUS_CONSUMED) {
        throw new Error(translations.paymentProcessConsumedError);
    }

    if (Status === STATUS_NOT_SUPPORTED) {
        throw new Error(translations.paymentProcessNotSupportedError);
    }

    if (Status === STATUS_CHARGEABLE) {
        return;
    }

    if (Status === STATUS_PENDING) {
        await wait(DELAY_PULLING);
        return pull({ Token, api, timer: timer + DELAY_PULLING, signal, translations });
    }

    throw new Error(translations.unknownPaymentTokenStatusError);
};

export type EnsureTokenChargeableInputs = Pick<PaymentTokenResult, 'ApprovalURL' | 'ReturnHost' | 'Token'> & {
    api: Api;
    signal: AbortSignal;
};

/**
 * Accepts the payment token as the input and processes it to make it chargeable.
 * Currently initializes a new tab where user can confirm the payment (3DS or Paypal confirmation).
 * After the verification tab is closed, the function checks the status of the token and resolves if it's chargeable.
 * An additional purpose of this function is to abstract away the verification mechanism and thus stress out that
 * alternative implementations are possible.
 */
export const ensureTokenChargeable = (
    { Token, api, ApprovalURL, ReturnHost, signal }: EnsureTokenChargeableInputs,
    translations: EnsureTokenChargeableTranslations,
    delayListening = DELAY_LISTENING
) => {
    const tab = window.open(ApprovalURL);

    return new Promise<void>((resolve, reject) => {
        let listen = false;

        const reset = () => {
            listen = false;
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            window.removeEventListener('message', onMessage, false);
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            signal.removeEventListener('abort', abort);
        };

        const listenTab = async (): Promise<any> => {
            if (!listen) {
                return;
            }

            if (tab && tab.closed) {
                try {
                    reset();
                    const { Status } = await api({ ...getTokenStatusV4(Token), signal });
                    if (Status === STATUS_CHARGEABLE) {
                        return resolve();
                    }

                    throw new Error(translations.tabClosedError);
                } catch (error: any) {
                    return reject({ ...error, tryAgain: true });
                }
            }

            await wait(delayListening);
            return listenTab();
        };

        const onMessage = (event: MessageEvent) => {
            if (getHostname(event.origin) !== ReturnHost) {
                return;
            }

            reset();
            tab?.close?.();

            const { cancel } = event.data;

            if (cancel === '1') {
                return reject();
            }

            pull({ Token, api, signal, translations }).then(resolve).catch(reject);
        };

        const abort = () => {
            reset();
            tab?.close?.();
            reject(new Error(translations.processAbortedError));
        };

        signal.addEventListener('abort', abort);
        window.addEventListener('message', onMessage, false);
        listen = true;
        listenTab();
    });
};

export function waitFor3ds(events: ChargebeeIframeEvents, tab: Window | null) {
    const removeEventListeners: RemoveEventListener[] = [];
    const threeDsChallengeSuccess = new Promise((resolve, reject) => {
        const listenerSuccess = events.onThreeDsSuccess((data) => {
            resolve(data);
        });

        // We don't provide any error data to the caller to avoid double-handling of the error event.
        // The error message coming from the iframe must be handled in a centralized way.
        const listenerError = events.onThreeDsFailure(() =>
            reject({
                threeDsFailure: true,
            })
        );

        const listenerSavedSuccess = events.onCardVeririfcationSuccess((data) => {
            resolve(data.authorizedPaymentIntent);
        });

        const listenerSavedError = events.onCardVeririfcationFailure(() =>
            reject({
                threeDsFailure: true,
            })
        );

        removeEventListeners.push(listenerSuccess);
        removeEventListeners.push(listenerError);
        removeEventListeners.push(listenerSavedSuccess);
        removeEventListeners.push(listenerSavedError);

        const interval = setInterval(() => {
            if (tab?.closed) {
                reject();
                clearInterval(interval);
            }
        }, 1000);
    });

    return threeDsChallengeSuccess.finally(() => {
        removeEventListeners.forEach((removeEventListener) => removeEventListener());
    });
}

export const ensureTokenChargeableV5 = async (
    token: ChargebeeFetchedPaymentToken,
    events: ChargebeeIframeEvents,
    {
        api,
        signal,
    }: {
        api: Api;
        signal: AbortSignal;
    },
    translations: EnsureTokenChargeableTranslations,
    delayListening = DELAY_LISTENING
) => {
    let tab: Window | null = null;
    if (!token.authorized) {
        tab = window.open(token.approvalUrl);
    }
    const noNeedToAuthorize = token.authorized;

    return new Promise<void>(async (resolve, reject) => {
        let pollingActive = true;

        const closeTab = () => {
            tab?.close?.();
        };

        const reset = () => {
            pollingActive = false;
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            signal?.removeEventListener('abort', abort);
        };

        const abort = () => {
            reset();
            closeTab();
            reject(new Error(translations.processAbortedError));
        };

        const listenTab = async (): Promise<void> => {
            if (!pollingActive) {
                return;
            }

            // tab && tab.closed means that there was approvalURl and now the tab is closed
            // Another case if !tab && token.authorized means that there was no approvalUrl and the token is already
            // authorized. For v5, we still to make sure that the token is chargeable.
            if ((tab && tab.closed) || noNeedToAuthorize) {
                try {
                    const { Status } = await api({ ...getTokenStatusV5(token.PaymentToken), signal });
                    if (Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE) {
                        return resolve();
                    }

                    throw new Error(translations.tabClosedError);
                } catch (error: any) {
                    return reject({ ...error, tryAgain: true });
                }
            }

            await wait(delayListening);
            return listenTab();
        };

        waitFor3ds(events, tab)
            .catch((error) => {
                if (error?.threeDsFailure) {
                    reject();
                }
            })
            .finally(() => {
                closeTab();
            });

        signal?.addEventListener('abort', abort);

        listenTab().catch(reject);
    });
};
