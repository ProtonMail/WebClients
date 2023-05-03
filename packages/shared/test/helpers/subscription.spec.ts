import { addWeeks } from 'date-fns';

import { External, Plan, Subscription } from '@proton/shared/lib/interfaces';

import { ADDON_NAMES, COUPON_CODES, CYCLE, PLANS } from '../../lib/constants';
import {
    getPlanIDs,
    hasLifetime,
    isManagedExternally,
    isTrial,
    isTrialExpired,
    willTrialExpire,
} from '../../lib/helpers/subscription';

let subscription: Subscription;
let defaultPlan: Plan;

beforeEach(() => {
    subscription = {
        ID: 'id-123',
        InvoiceID: 'invoice-id-123',
        Cycle: CYCLE.MONTHLY,
        PeriodStart: 123,
        PeriodEnd: 777,
        CreateTime: 123,
        CouponCode: null,
        Currency: 'EUR',
        Amount: 123,
        RenewAmount: 123,
        Discount: 123,
        Plans: [],
        External: External.Default,
    };

    defaultPlan = {
        ID: 'plan-id-123',
        Type: 0,
        Cycle: CYCLE.MONTHLY,
        Name: PLANS.BUNDLE,
        Title: 'Bundle',
        Currency: 'EUR',
        Amount: 123,
        MaxDomains: 123,
        MaxAddresses: 123,
        MaxSpace: 123,
        MaxCalendars: 123,
        MaxMembers: 123,
        MaxVPN: 123,
        MaxTier: 123,
        Services: 123,
        Features: 123,
        Quantity: 123,
        Pricing: {
            [CYCLE.MONTHLY]: 123,
            [CYCLE.YEARLY]: 123,
            [CYCLE.TWO_YEARS]: 123,
        },
        State: 123,
    };
});

describe('getPlanIDs', () => {
    it('should extract plans properly', () => {
        expect(
            getPlanIDs({
                ...subscription,
                Plans: [
                    { ...defaultPlan, Name: PLANS.BUNDLE_PRO, Quantity: 1 },
                    { ...defaultPlan, Name: PLANS.BUNDLE_PRO, Quantity: 1 },
                    { ...defaultPlan, Name: ADDON_NAMES.MEMBER_BUNDLE_PRO, Quantity: 3 },
                ],
            })
        ).toEqual({
            [PLANS.BUNDLE_PRO]: 2,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 3,
        });
    });
});

describe('hasLifetime', () => {
    it('should have LIFETIME', () => {
        subscription = {
            ...subscription,
            CouponCode: COUPON_CODES.LIFETIME,
        };

        expect(hasLifetime(subscription)).toBe(true);
    });

    it('should not have LIFETIME', () => {
        subscription = {
            ...subscription,
            CouponCode: 'PANDA',
        };

        expect(hasLifetime(subscription)).toBe(false);
    });
});

describe('isTrial', () => {
    it('should be a trial', () => {
        expect(isTrial({ ...subscription, CouponCode: COUPON_CODES.REFERRAL })).toBe(true);
    });

    it('should not be a trial', () => {
        expect(isTrial({ ...subscription, CouponCode: 'PANDA' })).toBe(false);
    });
});

describe('isTrialExpired', () => {
    it('should detect expired subscription', () => {
        const ts = Math.round((new Date().getTime() - 1000) / 1000);
        expect(isTrialExpired({ ...subscription, PeriodEnd: ts })).toBe(true);
    });

    it('should detect non-expired subscription', () => {
        const ts = Math.round((new Date().getTime() + 1000) / 1000);
        expect(isTrialExpired({ ...subscription, PeriodEnd: ts })).toBe(false);
    });
});

describe('willTrialExpire', () => {
    it('should detect close expiration', () => {
        const ts = Math.round((addWeeks(new Date(), 1).getTime() - 1000) / 1000);
        expect(willTrialExpire({ ...subscription, PeriodEnd: ts })).toBe(true);
    });

    it('should detect far expiration', () => {
        // Add 2 weeks from now and convert Date to unix timestamp
        const ts = Math.round(addWeeks(new Date(), 2).getTime() / 1000);
        expect(willTrialExpire({ ...subscription, PeriodEnd: ts })).toBe(false);
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
            Plans: [],
            External: External.Android,
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
            Plans: [],
            External: External.iOS,
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
            Plans: [],
            External: External.Default,
        });

        expect(result).toEqual(false);
    });
});
