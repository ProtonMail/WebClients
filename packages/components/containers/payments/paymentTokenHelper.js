import React from 'react';
import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from 'proton-shared/lib/constants';
import { getTokenStatus, createToken } from 'proton-shared/lib/api/payments';
import { wait } from 'proton-shared/lib/helpers/promise';
import { c } from 'ttag';
import { PaymentVerificationModal } from 'react-components';
import { getHostname } from 'proton-shared/lib/helpers/url';
import { omit } from 'proton-shared/lib/helpers/object';

const {
    STATUS_PENDING,
    STATUS_CHARGEABLE,
    STATUS_FAILED,
    STATUS_CONSUMED,
    STATUS_NOT_SUPPORTED
} = PAYMENT_TOKEN_STATUS;

const { TOKEN, BITCOIN, CASH } = PAYMENT_METHOD_TYPES;

const DELAY_PULLING = 5000;
const DELAY_LISTENING = 1000;

/**
 * Recursive function to check token status
 * @param {Number} timer
 * @param {String} Token
 * @param {Object} api useApi
 * @param {AbortSignal} signal instance
 * @returns {Promise}
 */
const pull = async ({ timer = 0, Token, api, signal }) => {
    if (signal.aborted) {
        throw new Error(c('Error').t`Process aborted`);
    }

    if (timer > DELAY_PULLING * 30) {
        throw new Error(c('Error').t`Payment process cancelled`);
    }

    const { Status } = await api({ ...getTokenStatus(Token), signal });

    if (Status === STATUS_FAILED) {
        throw new Error(c('Error').t`Payment process failed`);
    }

    if (Status === STATUS_CONSUMED) {
        throw new Error(c('Error').t`Payment process consumed`);
    }

    if (Status === STATUS_NOT_SUPPORTED) {
        throw new Error(c('Error').t`Payment process not supported`);
    }

    if (Status === STATUS_CHARGEABLE) {
        return;
    }

    if (Status === STATUS_PENDING) {
        await wait(DELAY_PULLING);
        return pull({ Token, api, timer: timer + DELAY_PULLING });
    }

    throw new Error(c('Error').t`Unknown payment token status`);
};

/**
 * Initialize new tab and listen it
 * @param {String} Token from API
 * @param {Object} api useApi
 * @param {String} ApprovalURL from API
 * @param {String} ReturnHost from API
 * @param {AbortSignal} signal instance
 * @returns {Promise}
 */
export const process = ({ Token, api, ApprovalURL, ReturnHost, signal }) => {
    const tab = window.open(ApprovalURL);

    return new Promise((resolve, reject) => {
        let listen = false;

        const reset = () => {
            listen = false;
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            window.removeEventListener('message', onMessage, false);
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            signal.removeEventListener('abort', abort);
        };

        const listenTab = async () => {
            if (!listen) {
                return;
            }

            if (tab.closed) {
                reset();
                return pull({ Token, api, signal })
                    .then(resolve)
                    .catch(() => {
                        const error = new Error(c('Error').t`Tab closed`);
                        error.tryAgain = true;
                        return reject(error);
                    });
            }

            await wait(DELAY_LISTENING);
            return listenTab(tab);
        };

        const onMessage = (event) => {
            const origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

            if (getHostname(origin) !== ReturnHost) {
                return;
            }

            reset();
            tab.close();

            const { cancel } = event.data;

            if (cancel === '1') {
                return reject();
            }

            pull({ Token, api, signal })
                .then(resolve)
                .catch(reject);
        };

        const abort = () => {
            reset();
            tab.close();
            reject(new Error(c('Error').t`Process aborted`));
        };

        signal.addEventListener('abort', abort);
        window.addEventListener('message', onMessage, false);
        listen = true;
        listenTab();
    });
};

/**
 * Prepare parameters to be sent to API
 * @param {Object} params
 * @param {String} Token
 * @param {String} type original type used to generate the token (card, paypal, paypal-credit)
 * @returns {Object}
 */
export const toParams = (params, Token, type) => {
    return {
        type,
        ...omit(params, ['PaymentMethodID']),
        Payment: {
            Type: TOKEN,
            Details: {
                Token
            }
        }
    };
};

export const handlePaymentToken = async ({ params, api, createModal, mode }) => {
    const { Payment, Amount, Currency, PaymentMethodID } = params;
    const { Type } = Payment || {};

    if (Amount === 0) {
        return omit(params, ['PaymentMethodID', 'Payment']);
    }

    if ([CASH, BITCOIN, TOKEN].includes(Type)) {
        return params;
    }

    const { Token, Status, ApprovalURL, ReturnHost } = await api(
        createToken({
            Payment,
            Amount,
            Currency,
            PaymentMethodID
        })
    );

    if (Status === STATUS_CHARGEABLE) {
        return toParams(params, Token, Type);
    }

    return new Promise((resolve, reject) => {
        createModal(
            <PaymentVerificationModal
                mode={mode}
                payment={Payment}
                params={params}
                token={Token}
                onSubmit={resolve}
                onClose={reject}
                onProcess={() => {
                    const abort = new AbortController();
                    return {
                        promise: process({
                            Token,
                            api,
                            ReturnHost,
                            ApprovalURL,
                            signal: abort.signal
                        }),
                        abort
                    };
                }}
            />
        );
    });
};
