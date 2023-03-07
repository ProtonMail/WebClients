import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

import { ExistingPayment, TokenPayment, TokenPaymentMethod, WrappedCardPayment } from './interface';

/**
 * Prepare parameters to be sent to API
 */
export const toParams = (
    params: WrappedCardPayment | ExistingPayment,
    Token: string,
    type?: string
): TokenPaymentMethod & { type?: string } => {
    const Payment: TokenPayment = {
        Type: PAYMENT_METHOD_TYPES.TOKEN,
        Details: {
            Token,
        },
    };

    return {
        ...params,
        type,
        Payment,
    };
};
