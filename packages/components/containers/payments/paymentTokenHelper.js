import React from 'react';
import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from 'proton-shared/lib/constants';
import { getTokenStatus, createToken } from 'proton-shared/lib/api/payments';
import { wait } from 'proton-shared/lib/helpers/promise';
import { c } from 'ttag';
import { PaymentVerificationModal } from 'react-components';

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
 * @returns {Promise}
 */
const pull = async ({ timer = 0, Token, api }) => {
    if (timer > DELAY_PULLING * 30) {
        throw new Error(c('Error').t`Payment process cancelled`);
    }

    const { Status } = await api(getTokenStatus(Token));

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
 * @param {String} String
 * @param {Object} api useApi
 * @param {String} approvalURL
 * @param {String} secureURL
 * @returns {Promise}
 */
export const process = ({ Token, api, approvalURL, secureURL }) => {
    const tab = window.open(approvalURL);

    return new Promise((resolve, reject) => {
        let listen = false;

        const reset = () => {
            listen = false;
            window.removeEventListener('message', onMessage, false);
            tab.close();
        };

        const listenTab = async () => {
            if (!listen) {
                return;
            }

            if (tab.closed) {
                reject(new Error(c('Error').t`Tab closed`));
            }

            await wait(DELAY_LISTENING);
            return listenTab(tab);
        };

        const onMessage = (event) => {
            const origin = event.origin || event.originalEvent.origin; // For Chrome, the origin property is in the event.originalEvent object.

            if (origin !== secureURL) {
                return;
            }

            if (event.source !== tab) {
                return;
            }

            reset();

            const { cancel } = event.data;

            if (cancel === '1') {
                return reject();
            }

            pull({ Token, api })
                .then(resolve)
                .catch(reject);
        };

        window.addEventListener('message', onMessage, false);
        listen = true;
        listenTab();
    });
};

/**
 * Prepare parameters to be sent to API
 * @param {Object} params
 * @param {String} Token
 * @returns {Object}
 */
export const toParams = (params, Token) => {
    return {
        ...params,
        Payment: {
            Type: TOKEN,
            Details: {
                Token
            }
        }
    };
};

export const handlePaymentToken = async ({ params, api, createModal }) => {
    const { Payment, Amount, Currency, PaymentMethodID } = params;
    const { Type } = Payment || {};

    if ([CASH, BITCOIN, TOKEN].includes(Type)) {
        return params;
    }

    const { Token, Status, ApprovalURL } = await api(createToken({ Payment, Amount, Currency, PaymentMethodID }));

    if (Status === STATUS_CHARGEABLE) {
        return toParams(params, Token);
    }

    return new Promise((resolve, reject) => {
        createModal(
            <PaymentVerificationModal
                params={params}
                approvalURL={ApprovalURL}
                token={Token}
                onSubmit={resolve}
                onClose={reject}
            />
        );
    });
};
