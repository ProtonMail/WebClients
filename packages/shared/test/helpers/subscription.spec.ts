import { addWeeks } from 'date-fns';

import { External, Plan, PlanIDs, PlansMap, Renew, Subscription } from '@proton/shared/lib/interfaces';

import { ADDON_NAMES, COUPON_CODES, CYCLE, PLANS } from '../../lib/constants';
import {
    getPlanIDs,
    getPricingFromPlanIDs,
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
        Renew: Renew.Enabled,
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
        Offers: [],
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

describe('getPricingFromPlanIDs', () => {
    it('returns the correct pricing for a single plan ID', () => {
        const planIDs: PlanIDs = { pass2023: 1 };
        const plansMap: PlansMap = {
            pass2023: {
                ID: 'id123',
                Type: 1,
                Name: PLANS.PASS_PLUS,
                Title: 'Pass Plus',
                MaxDomains: 0,
                MaxAddresses: 0,
                MaxCalendars: 0,
                MaxSpace: 0,
                MaxMembers: 0,
                MaxVPN: 0,
                MaxTier: 0,
                Services: 8,
                Features: 0,
                State: 1,
                Pricing: {
                    '1': 499,
                    '12': 1200,
                    '24': 7176,
                },
                Currency: 'CHF',
                Quantity: 1,
                Offers: [
                    {
                        Name: 'passlaunch',
                        StartTime: 1684758588,
                        EndTime: 1688110913,
                        Pricing: {
                            '12': 1200,
                        },
                    },
                ],
                Cycle: 1,
                Amount: 499,
            },
        };

        const expected = {
            all: {
                '1': 499,
                '12': 1200,
                '15': 0,
                '24': 7176,
                '30': 0,
            },
            plans: {
                '1': 499,
                '12': 1200,
                '15': 0,
                '24': 7176,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);
        expect(result).toEqual(expected);
    });
});
