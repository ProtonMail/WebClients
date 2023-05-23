import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

import { OnPayResult } from '../usePayPal';

export default jest.fn(({ onPay }) => {
    return {
        isReady: true,
        loadingToken: false,
        loadingVerification: false,
        onToken: jest.fn().mockResolvedValue({}),
        onVerification: jest.fn(() => {
            const token: OnPayResult = {
                Payment: {
                    Type: PAYMENT_METHOD_TYPES.TOKEN,
                    Details: {
                        Token: 'paypal-payment-token-123',
                    },
                },
                Amount: 5000,
                Currency: 'EUR',
                type: PAYMENT_METHOD_TYPES.PAYPAL,
            };
            onPay(token);
            return Promise.resolve({});
        }),
        clear: jest.fn(),
    };
});
