import { renderHook } from '@testing-library/react-hooks';

import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

import usePayment from './usePayment';

jest.mock('./usePayPal', () =>
    jest.fn().mockReturnValue({
        clear: jest.fn(),
        onToken: jest.fn().mockReturnValue(Promise.resolve()),
    })
);

describe('usePayment', () => {
    it('should render', () => {
        let { result } = renderHook(() =>
            usePayment({
                amount: 1000,
                currency: 'EUR',
                onPay: () => {},
            })
        );

        expect(result.current).toBeDefined();
    });

    it('should be able to pay if amount is 0', () => {
        let { result } = renderHook(() =>
            usePayment({
                amount: 0,
                currency: 'EUR',
                onPay: () => {},
            })
        );

        expect(result.current.canPay).toEqual(true);
    });

    it('should not able to pay if method is not defined', () => {
        let { result } = renderHook(() =>
            usePayment({
                amount: 1000,
                currency: 'EUR',
                onPay: () => {},
            })
        );

        expect(result.current.canPay).toEqual(false);
    });

    it('should not able to pay if method is cash', () => {
        let { result } = renderHook(() =>
            usePayment({
                amount: 1000,
                defaultMethod: PAYMENT_METHOD_TYPES.CASH,
                currency: 'EUR',
                onPay: () => {},
            })
        );

        expect(result.current.canPay).toEqual(false);
    });

    it('should not able to pay if method is bitcoin', () => {
        let { result } = renderHook(() =>
            usePayment({
                amount: 1000,
                defaultMethod: PAYMENT_METHOD_TYPES.BITCOIN,
                currency: 'EUR',
                onPay: () => {},
            })
        );

        expect(result.current.canPay).toEqual(false);
    });

    it('should not be able to pay of method is paypal and there is no payment token', () => {
        let { result } = renderHook(() =>
            usePayment({
                amount: 1000,
                defaultMethod: PAYMENT_METHOD_TYPES.PAYPAL,
                currency: 'EUR',
                onPay: () => {},
            })
        );

        expect(result.current.canPay).toEqual(false);
    });
});
