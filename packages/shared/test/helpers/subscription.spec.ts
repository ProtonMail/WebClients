import { addWeeks } from 'date-fns';

import { External, RenewState } from '@proton/shared/lib/interfaces';

import { COUPON_CODES, CYCLE } from '../../lib/constants';
import {
    getPlanIDs,
    hasLifetime,
    isManagedExternally,
    isTrial,
    isTrialExpired,
    willTrialExpire,
} from '../../lib/helpers/subscription';

describe('getPlanIDs', () => {
    it('should extract plans properly', () => {
        expect(
            getPlanIDs({
                Plans: [
                    { Name: 'a', Quantity: 1 },
                    { Name: 'a', Quantity: 1 },
                    { Name: 'b', Quantity: 3 },
                ],
            } as any)
        ).toEqual({
            a: 2,
            b: 3,
        } as any);
    });
});

describe('hasLifetime', () => {
    it('should have LIFETIME', () => {
        expect(hasLifetime({ CouponCode: COUPON_CODES.LIFETIME } as any)).toBe(true);
    });

    it('should not have LIFETIME', () => {
        expect(hasLifetime({ CouponCode: 'PANDA' } as any)).toBe(false);
    });
});

describe('isTrial', () => {
    it('should be a trial', () => {
        expect(isTrial({ CouponCode: COUPON_CODES.REFERRAL } as any)).toBe(true);
    });

    it('should not be a trial', () => {
        expect(isTrial({ CouponCode: 'PANDA' } as any)).toBe(false);
    });
});

describe('isTrialExpired', () => {
    it('should detect expired subscription', () => {
        const ts = Math.round((new Date().getTime() - 1000) / 1000);
        expect(isTrialExpired({ PeriodEnd: ts } as any)).toBe(true);
    });

    it('should detect non-expired subscription', () => {
        const ts = Math.round((new Date().getTime() + 1000) / 1000);
        expect(isTrialExpired({ PeriodEnd: ts } as any)).toBe(false);
    });
});

describe('willTrialExpire', () => {
    it('should detect close expiration', () => {
        const ts = Math.round((addWeeks(new Date(), 1).getTime() - 1000) / 1000);
        expect(willTrialExpire({ PeriodEnd: ts } as any)).toBe(true);
    });

    it('should detect far expiration', () => {
        // Add 2 weeks from now and convert Date to unix timestamp
        const ts = Math.round(addWeeks(new Date(), 2).getTime() / 1000);
        expect(willTrialExpire({ PeriodEnd: ts } as any)).toBe(false);
    });
});

describe('isManagedExternally', () => {
    it('should return true if managed by Android', () => {
        const result = isManagedExternally({
            ID: 'id-123',
            InvoiceID: 'invoice-id-123',
            Cycle: CYCLE.MONTHLY,
            PeriodStart: 123,
            PeriodEnd: 777,
            CreateTime: 123,
            CouponCode: null,
            Currency: 'CHF',
            Amount: 1199,
            RenewAmount: 1199,
            Discount: 0,
            Plans: {} as any,
            External: External.Android,
            Renew: RenewState.Active,
        });

        expect(result).toEqual(true);
    });

    it('should return true if managed by Apple', () => {
        const result = isManagedExternally({
            ID: 'id-123',
            InvoiceID: 'invoice-id-123',
            Cycle: CYCLE.MONTHLY,
            PeriodStart: 123,
            PeriodEnd: 777,
            CreateTime: 123,
            CouponCode: null,
            Currency: 'CHF',
            Amount: 1199,
            RenewAmount: 1199,
            Discount: 0,
            Plans: {} as any,
            External: External.iOS,
            Renew: RenewState.Active,
        });

        expect(result).toEqual(true);
    });

    it('should return false if managed by us', () => {
        const result = isManagedExternally({
            ID: 'id-123',
            InvoiceID: 'invoice-id-123',
            Cycle: CYCLE.MONTHLY,
            PeriodStart: 123,
            PeriodEnd: 777,
            CreateTime: 123,
            CouponCode: null,
            Currency: 'CHF',
            Amount: 1199,
            RenewAmount: 1199,
            Discount: 0,
            Plans: {} as any,
            External: External.Default,
            Renew: RenewState.Active,
        });

        expect(result).toEqual(false);
    });
});
