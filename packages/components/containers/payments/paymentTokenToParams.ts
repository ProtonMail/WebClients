import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { Params } from './interface';

/**
 * Prepare parameters to be sent to API
 */
export const toParams = (params: Params, Token: string, type?: string) => {
    return {
        ...params,
        type,
        Payment: {
            Type: PAYMENT_METHOD_TYPES.TOKEN,
            Details: {
                Token,
            },
        },
    };
};
