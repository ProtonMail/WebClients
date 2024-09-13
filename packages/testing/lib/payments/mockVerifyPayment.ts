import type { TokenPaymentMethod } from '@proton/payments';
import { PAYMENT_METHOD_TYPES } from '@proton/payments';

export function mockVerifyPayment() {
    const verifyPayment = jest.fn();

    (verifyPayment as any).mockVerification = (
        value: TokenPaymentMethod = {
            Payment: {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: 'token123',
                },
            },
        }
    ) => verifyPayment.mockResolvedValue(value);

    return verifyPayment as jest.Mock & {
        mockVerification: (value?: TokenPaymentMethod) => jest.Mock;
    };
}
