import { c } from 'ttag';

import { CreateTokenData, createToken, getTokenStatus } from '@proton/shared/lib/api/payments';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getHostname } from '@proton/shared/lib/helpers/url';
import { Api } from '@proton/shared/lib/interfaces';

import { PAYMENT_TOKEN_STATUS } from './constants';
import {
    AmountAndCurrency,
    CardPayment,
    ExistingPayment,
    PaymentTokenResult,
    TokenPaymentMethod,
    WrappedCardPayment,
    isExistingPayment,
    isTokenPaymentMethod,
} from './interface';
import { toTokenPaymentMethod } from './utils';

const { STATUS_PENDING, STATUS_CHARGEABLE, STATUS_FAILED, STATUS_CONSUMED, STATUS_NOT_SUPPORTED } =
    PAYMENT_TOKEN_STATUS;

const DELAY_PULLING = 5000;
const DELAY_LISTENING = 1000;

/**
 * Recursive function to check token status
 */
const pull = async ({
    timer = 0,
    Token,
    api,
    signal,
}: {
    timer?: number;
    Token: string;
    api: Api;
    signal: AbortSignal;
}): Promise<any> => {
    if (signal.aborted) {
        throw new Error(c('Error').t`Process aborted`);
    }

    if (timer > DELAY_PULLING * 30) {
        throw new Error(c('Error').t`Payment process canceled`);
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
        return pull({ Token, api, timer: timer + DELAY_PULLING, signal });
    }

    throw new Error(c('Error').t`Unknown payment token status`);
};

/**
 * Initialize new tab and listen it
 */
export const process = (
    {
        Token,
        api,
        ApprovalURL,
        ReturnHost,
        signal,
    }: Pick<PaymentTokenResult, 'ApprovalURL' | 'ReturnHost' | 'Token'> & {
        api: Api;
        signal: AbortSignal;
    },
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
                    throw new Error(c('Error').t`Tab closed`);
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

            pull({ Token, api, signal }).then(resolve).catch(reject);
        };

        const abort = () => {
            reset();
            tab?.close();
            reject(new Error(c('Error').t`Process aborted`));
        };

        signal.addEventListener('abort', abort);
        window.addEventListener('message', onMessage, false);
        listen = true;
        listenTab();
    });
};

/**
 * Prepares the parameters and makes the API call to create the payment token.
 *
 * @param params
 * @param api
 * @param amountAndCurrency
 */
const fetchPaymentToken = async (
    params: WrappedCardPayment | ExistingPayment,
    api: Api,
    amountAndCurrency?: AmountAndCurrency
): Promise<PaymentTokenResult> => {
    const data: CreateTokenData = { ...amountAndCurrency, ...params };

    return api<PaymentTokenResult>({
        ...createToken(data),
        notificationExpiration: 10000,
    });
};

type CreatePaymentTokenOptions = {
    addCardMode?: boolean;
    amountAndCurrency?: AmountAndCurrency;
};

/**
 * Creates a {@link TokenPaymentMethod} from the credit card details or from the existing (saved) payment method.
 * This function doesn't handle cash or Bitcoin payment methods because they don't require payment token.
 * This function doesn't handle PayPal methods because it's handled by {@link usePayPal} hook.
 *
 * @param params
 * @param api
 * @param createModal
 * @param mode
 * @param amountAndCurrency – optional. We can create a payment token even without amount and currency. In this case it
 * can't be used for payment purposes. But it still can be used to create a new payment method, e.g. save credit card.
 */
export const createPaymentToken = async (
    params: WrappedCardPayment | TokenPaymentMethod | ExistingPayment,
    verify: VerifyPayment,
    api: Api,
    { addCardMode, amountAndCurrency }: CreatePaymentTokenOptions = {}
): Promise<TokenPaymentMethod> => {
    if (isTokenPaymentMethod(params)) {
        return params;
    }

    const { Token, Status, ApprovalURL, ReturnHost } = await fetchPaymentToken(params, api, amountAndCurrency);

    if (Status === STATUS_CHARGEABLE) {
        // If the payment token is already chargeable then we're all set. Just prepare the format and return it.
        return toTokenPaymentMethod(Token);
    }

    let Payment: CardPayment | undefined;
    if (!isExistingPayment(params)) {
        Payment = params.Payment;
    }

    /**
     * However there are other cases. The most common one (within the happy path) is {@link STATUS_PENDING}.
     * One typical reason is a 3DS verification requirement. In this case we show user a modal informing them about
     * 3DS verification in a new tab. While user is on the bank page, we call {@link process}. Essentially, it polls
     * the payment token status (e.g. every 5 seconds). Once {@link process} resolves then the entire return promise
     * resolves to a {@link TokenPaymentMethod} – newly created payment token.
     */
    return verify({ addCardMode, Payment, Token, ApprovalURL, ReturnHost });
};

export type VerifyPayment = (params: {
    addCardMode?: boolean;
    Payment?: CardPayment;
    Token: string;
    ApprovalURL?: string;
    ReturnHost?: string;
}) => Promise<TokenPaymentMethod>;

export const getCreatePaymentToken =
    (verify: VerifyPayment, api: Api) =>
    (
        paymentParams: WrappedCardPayment | TokenPaymentMethod | ExistingPayment,
        options: CreatePaymentTokenOptions
    ): Promise<TokenPaymentMethod> =>
        createPaymentToken(paymentParams, verify, api, options);
