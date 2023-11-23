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

export const formatToken = (
    { Token, Status, ApprovalURL, ReturnHost }: PaymentTokenResult,
    type: PlainPaymentMethodType,
    amountAndCurrency?: AmountAndCurrency
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
    amountAndCurrency?: AmountAndCurrency
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
