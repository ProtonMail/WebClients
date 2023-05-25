import { PAYMENT_METHOD_TYPES } from './constants';
import { TokenPayment, TokenPaymentMethod } from './interface';

/**
 * Prepare parameters to be sent to API
 */
export const toTokenPaymentMethod = (Token: string): TokenPaymentMethod => {
    const Payment: TokenPayment = {
        Type: PAYMENT_METHOD_TYPES.TOKEN,
        Details: {
            Token,
        },
    };

    return {
        Payment,
    };
};
