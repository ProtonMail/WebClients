import { renderHook } from '@testing-library/react-hooks';

import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

import { CardPayment, PaymentParameters } from './interface';
import usePayment from './usePayment';

jest.mock('./usePayPal', () =>
    jest.fn().mockReturnValue({
        clear: jest.fn(),
        onToken: jest.fn().mockReturnValue(Promise.resolve()),
    })
);

describe('usePayment', () => {
    it('should render', () => {
        const { result } = renderHook(() =>
            usePayment({
                amount: 1000,
                currency: 'EUR',
                onPay: () => {},
            })
        );

        expect(result.current).toBeDefined();
    });

    it('should be able to pay if amount is 0', () => {
        const { result } = renderHook(() =>
            usePayment({
                amount: 0,
                currency: 'EUR',
                onPay: () => {},
            })
        );

        expect(result.current.canPay).toEqual(true);
    });

    it('should not able to pay if method is not defined', () => {
        const { result } = renderHook(() =>
            usePayment({
                amount: 1000,
                currency: 'EUR',
                onPay: () => {},
            })
        );

        expect(result.current.canPay).toEqual(false);
    });

    it.each([PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN])(
        'should not able to pay if method is %s',
        (defaultMethod) => {
            const { result } = renderHook(() =>
                usePayment({
                    amount: 1000,
                    defaultMethod,
                    currency: 'EUR',
                    onPay: () => {},
                })
            );

            expect(result.current.canPay).toEqual(false);
        }
    );

    it('should not be able to pay of method is paypal and there is no payment token', () => {
        const { result } = renderHook(() =>
            usePayment({
                amount: 1000,
                defaultMethod: PAYMENT_METHOD_TYPES.PAYPAL,
                currency: 'EUR',
                onPay: () => {},
            })
        );

        expect(result.current.canPay).toEqual(false);
    });

    describe('payment parameters', () => {
        it('should return empty object if there is no method', () => {
            const { result } = renderHook(() =>
                usePayment({
                    amount: 1000,
                    currency: 'EUR',
                    onPay: () => {},
                })
            );

            expect(result.current.parameters).toEqual({});
        });

        it('should return PaymentMethodID if user selected an existing method', () => {
            const { result } = renderHook(() =>
                usePayment({
                    amount: 1000,
                    currency: 'EUR',
                    onPay: () => {},
                })
            );

            result.current.setMethod('existing-payment-method-id');

            expect(result.current.parameters).toEqual({
                PaymentMethodID: 'existing-payment-method-id',
            });
        });

        it('should return CardPayment if method is card', () => {
            const { result } = renderHook(() =>
                usePayment({
                    amount: 1000,
                    currency: 'EUR',
                    onPay: () => {},
                    defaultMethod: PAYMENT_METHOD_TYPES.CARD,
                })
            );

            const expectedPaymentParameters: PaymentParameters<CardPayment> = {
                Payment: {
                    Type: PAYMENT_METHOD_TYPES.CARD,
                    Details: {
                        CVC: '',
                        Country: 'US',
                        ExpMonth: '',
                        ExpYear: '',
                        Name: '',
                        Number: '',
                        ZIP: '',
                    },
                },
            };

            expect(result.current.parameters).toEqual(expectedPaymentParameters);
        });

        it.each([PAYMENT_METHOD_TYPES.PAYPAL, PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN])(
            'should return empty paymentMethods for %s',
            (defaultMethod) => {
                const { result } = renderHook(() =>
                    usePayment({
                        amount: 1000,
                        currency: 'EUR',
                        onPay: () => {},
                        defaultMethod,
                    })
                );

                expect(result.current.parameters).toEqual({});
            }
        );
    });
});
