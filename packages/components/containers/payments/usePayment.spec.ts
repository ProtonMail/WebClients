import { renderHook } from '@testing-library/react-hooks';

import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

import { CardModel, CardPayment, PaymentParameters } from './interface';
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

    describe('handleCardSubmit', () => {
        it('should return true if amount is 0', () => {
            const { result } = renderHook(() =>
                usePayment({
                    amount: 0,
                    currency: 'EUR',
                    onPay: () => {},
                })
            );

            expect(result.current.handleCardSubmit()).toEqual(true);
        });

        it('should return false if method is card and the details are not valid', () => {
            const { result } = renderHook(() =>
                usePayment({
                    amount: 1000,
                    currency: 'EUR',
                    onPay: () => {},
                    defaultMethod: PAYMENT_METHOD_TYPES.CARD,
                })
            );

            expect(result.current.handleCardSubmit()).toEqual(false);
        });

        it.each(
            Object.values(PAYMENT_METHOD_TYPES)
                .filter((it) => it !== PAYMENT_METHOD_TYPES.CARD)
                .concat('custom-payment-method' as any)
        )('should return true if payment method is not card: %s', (defaultMethod) => {
            const { result } = renderHook(() =>
                usePayment({
                    amount: 1000,
                    currency: 'EUR',
                    onPay: () => {},
                    defaultMethod,
                })
            );

            expect(result.current.handleCardSubmit()).toEqual(true);
        });

        it('should return true if card is valid', () => {
            const { result } = renderHook(() =>
                usePayment({
                    amount: 1000,
                    currency: 'EUR',
                    onPay: () => {},
                    defaultMethod: PAYMENT_METHOD_TYPES.CARD,
                })
            );

            const card: CardModel = {
                fullname: 'Arthur Morgan',
                number: '5555555555554444',
                month: '01',
                year: '32',
                cvc: '123',
                zip: '12345',
                country: 'US',
            };

            for (const [key, value] of Object.entries(card)) {
                result.current.setCard(key as keyof CardModel, value);
            }

            expect(result.current.handleCardSubmit()).toEqual(true);
        });
    });
});
