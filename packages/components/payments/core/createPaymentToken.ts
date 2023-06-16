import { CreateTokenData, createToken } from '@proton/shared/lib/api/payments';
import { Api } from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from './constants';
import {
    AmountAndCurrency,
    CardPayment,
    ChargeablePaymentToken,
    ExistingPayment,
    ExistingPaymentMethod,
    NonChargeablePaymentToken,
    PaymentTokenResult,
    PaypalPayment,
    PlainPaymentMethodType,
    TokenPaymentMethod,
    WrappedCardPayment,
    isExistingPayment,
    isTokenPaymentMethod,
} from './interface';
import { toTokenPaymentMethod } from './utils';

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
    verify: PaymentVerificator,
    api: Api,
    { addCardMode, amountAndCurrency }: CreatePaymentTokenOptions = {}
): Promise<TokenPaymentMethod> => {
    if (isTokenPaymentMethod(params)) {
        return params;
    }

    const { Token, Status, ApprovalURL, ReturnHost } = await fetchPaymentToken(params, api, amountAndCurrency);

    if (Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE) {
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
     * 3DS verification in a new tab. While user is on the bank page, we call {@link ensureTokenChargeable}. Essentially, it polls
     * the payment token status (e.g. every 5 seconds). Once {@link ensureTokenChargeable} resolves then the entire return promise
     * resolves to a {@link TokenPaymentMethod} – newly created payment token.
     */
    return verify({ addCardMode, Payment, Token, ApprovalURL, ReturnHost });
};

export const formatToken = (
    { Token, Status, ApprovalURL, ReturnHost }: PaymentTokenResult,
    type: PlainPaymentMethodType,
    amountAndCurrency: AmountAndCurrency
): ChargeablePaymentToken | NonChargeablePaymentToken => {
    const chargeable = Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE;
    const tokenPaymentMethod = toTokenPaymentMethod(Token);

    const base = {
        type,
        chargeable,
        ...amountAndCurrency,
        ...tokenPaymentMethod,
    };

    if (chargeable) {
        return base as ChargeablePaymentToken;
    } else {
        return {
            ...base,
            status: Status,
            approvalURL: ApprovalURL,
            returnHost: ReturnHost,
        } as NonChargeablePaymentToken;
    }
};

export const createPaymentTokenForCard = async (
    params: WrappedCardPayment,
    api: Api,
    amountAndCurrency: AmountAndCurrency
): Promise<ChargeablePaymentToken | NonChargeablePaymentToken> => {
    const paymentTokenResult = await fetchPaymentToken(params, api, amountAndCurrency);
    return formatToken(paymentTokenResult, PAYMENT_METHOD_TYPES.CARD, amountAndCurrency);
};

export const createPaymentTokenForExistingPayment = async (
    PaymentMethodID: ExistingPaymentMethod,
    type: PAYMENT_METHOD_TYPES.CARD | PAYMENT_METHOD_TYPES.PAYPAL,
    api: Api,
    amountAndCurrency: AmountAndCurrency
): Promise<ChargeablePaymentToken | NonChargeablePaymentToken> => {
    const paymentTokenResult = await fetchPaymentToken(
        {
            PaymentMethodID,
        },
        api,
        amountAndCurrency
    );
    return formatToken(paymentTokenResult, type, amountAndCurrency);
};

export type PaymentVerificator = (params: {
    addCardMode?: boolean;
    Payment?: CardPayment | PaypalPayment;
    Token: string;
    ApprovalURL?: string;
    ReturnHost?: string;
}) => Promise<TokenPaymentMethod>;

export type PaymentTokenCreator = (
    paymentParams: WrappedCardPayment | TokenPaymentMethod | ExistingPayment,
    options: CreatePaymentTokenOptions
) => Promise<TokenPaymentMethod>;

export const getCreatePaymentToken = (verify: PaymentVerificator, api: Api): PaymentTokenCreator => {
    const paymentTokenCreator: PaymentTokenCreator = (paymentParams, options) =>
        createPaymentToken(paymentParams, verify, api, options);

    return paymentTokenCreator;
};
