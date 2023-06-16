import { getTokenStatus } from '@proton/shared/lib/api/payments';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getHostname } from '@proton/shared/lib/helpers/url';
import { Api } from '@proton/shared/lib/interfaces';

import { PAYMENT_TOKEN_STATUS } from './constants';
import { PaymentTokenResult } from './interface';

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

    const { Status } = await api({ ...getTokenStatus(Token), signal });

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
 * Initialize new tab and listen it
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
                    const { Status } = await api({ ...getTokenStatus(Token), signal });
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
            tab?.close();

            const { cancel } = event.data;

            if (cancel === '1') {
                return reject();
            }

            pull({ Token, api, signal, translations }).then(resolve).catch(reject);
        };

        const abort = () => {
            reset();
            tab?.close();
            reject(new Error(translations.processAbortedError));
        };

        signal.addEventListener('abort', abort);
        window.addEventListener('message', onMessage, false);
        listen = true;
        listenTab();
    });
};
