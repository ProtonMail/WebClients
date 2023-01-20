import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

import { Params, TokenPayment } from './interface';

/**
 * Prepare parameters to be sent to API
 */
export const toParams = (params: Params, Token: string, type?: string) => {
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
