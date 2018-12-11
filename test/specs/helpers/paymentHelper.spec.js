import { isInvalidCoupon } from '../../../src/helpers/paymentHelper';

describe('payment helper', () => {
    describe('coupon', () => {
        it('should handle no code', () => {
            expect(isInvalidCoupon()).toBeFalsy();
            expect(isInvalidCoupon('', { Coupon: null })).toBeFalsy();
        });

        it('should handle same code', () => {
            expect(isInvalidCoupon('bundle', { Coupon: { Code: 'bundle' } })).toBeFalsy();
        });

        it('should handle diff code', () => {
            expect(isInvalidCoupon('asd', { Coupon: null })).toBeTruthy();
            expect(isInvalidCoupon('bundle', { Coupon: { Code: 'best' } })).toBeTruthy();
        });
    });
});
