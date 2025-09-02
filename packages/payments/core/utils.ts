import { PAYMENT_METHOD_TYPES } from './constants';
import type { TokenPaymentMethod, V5PaymentToken } from './interface';

export const toV5PaymentToken = (PaymentToken: string): V5PaymentToken => {
    return {
        PaymentToken,
        v: 5,
    };
};

export function sanitizeV5PaymentToken(data: V5PaymentToken): V5PaymentToken {
    const sanitizedData: V5PaymentToken = {
        v: 5,
        PaymentToken: data.PaymentToken,
    };

    return sanitizedData;
}

export function v5PaymentTokenToLegacyPaymentToken(data: V5PaymentToken): TokenPaymentMethod {
    return {
        Payment: {
            Type: PAYMENT_METHOD_TYPES.TOKEN,
            Details: {
                Token: data.PaymentToken,
            },
        },
    };
}
