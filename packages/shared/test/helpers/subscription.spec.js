import { addWeeks } from 'date-fns';
import { COUPON_CODES } from '../../lib/constants';
import { getPlanIDs, hasLifetime, isTrial, isTrialExpired, willTrialExpire } from '../../lib/helpers/subscription';

describe('getPlanIDs', () => {
    it('should extract plans properly', () => {
        expect(
            getPlanIDs({
                Plans: [
                    { ID: 'a', Quantity: 1 },
                    { ID: 'a', Quantity: 1 },
                    { ID: 'b', Quantity: 3 },
                ],
            })
        ).toEqual({
            a: 2,
            b: 3,
        });
    });
});

describe('hasLifetime', () => {
    it('should have LIFETIME', () => {
        expect(hasLifetime({ CouponCode: COUPON_CODES.LIFETIME })).toBe(true);
    });

    it('should not have LIFETIME', () => {
        expect(hasLifetime({ CouponCode: 'PANDA' })).toBe(false);
    });
});

describe('isTrial', () => {
    it('should be a trial', () => {
        expect(isTrial({ CouponCode: COUPON_CODES.REFERRAL })).toBe(true);
    });

    it('should not be a trial', () => {
        expect(isTrial({ CouponCode: 'PANDA' })).toBe(false);
    });
});

describe('isTrialExpired', () => {
    it('should detect expired subscription', () => {
        const ts = Math.round((new Date().getTime() - 1000) / 1000);
        expect(isTrialExpired({ PeriodEnd: ts })).toBe(true);
    });

    it('should detect non-expired subscription', () => {
        const ts = Math.round((new Date().getTime() + 1000) / 1000);
        expect(isTrialExpired({ PeriodEnd: ts })).toBe(false);
    });
});

describe('willTrialExpire', () => {
    it('should detect close expiration', () => {
        const ts = Math.round((addWeeks(new Date(), 1).getTime() - 1000) / 1000);
        expect(willTrialExpire({ PeriodEnd: ts })).toBe(true);
    });

    it('should detect far expiration', () => {
        // Add 2 weeks from now and convert Date to unix timestamp
        const ts = Math.round(addWeeks(new Date(), 2).getTime() / 1000);
        expect(willTrialExpire({ PeriodEnd: ts })).toBe(false);
    });
});
