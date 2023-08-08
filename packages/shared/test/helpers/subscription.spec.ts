import { addWeeks } from 'date-fns';

import { pick } from '@proton/shared/lib/helpers/object';
import { External, Plan, PlanIDs, PlansMap, Renew, Subscription } from '@proton/shared/lib/interfaces';
// that has to be a very granular import, because in general @proton/testing depends on jest while @proton/shared
// still uses Karma. The payments data specifically don't need jest, so it's safe to impoet it directly
import { PLANS_MAP } from '@proton/testing/lib/payments';

import { ADDON_NAMES, COUPON_CODES, CYCLE, PLANS } from '../../lib/constants';
import {
    getPlanIDs,
    getPricingFromPlanIDs,
    getTotalFromPricing,
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
            membersNumber: 1,
            members: {
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

    it('should return correct pricing for Mail Pro: no addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.MAIL_PRO]);

        const expected = {
            all: {
                '1': 799,
                '12': 8388,
                '15': 0,
                '24': 15576,
                '30': 0,
            },
            membersNumber: 1,
            members: {
                '1': 799,
                '12': 8388,
                '15': 0,
                '24': 15576,
                '30': 0,
            },
            plans: {
                '1': 799,
                '12': 8388,
                '15': 0,
                '24': 15576,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);
        expect(result).toEqual(expected);
    });

    it('should return correct pricing for Mail Pro: with addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.MAIL_PRO]: 1,
            [ADDON_NAMES.MEMBER_MAIL_PRO]: 7,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.MAIL_PRO, ADDON_NAMES.MEMBER_MAIL_PRO]);

        const expected = {
            all: {
                '1': 6392,
                '12': 67104,
                '15': 0,
                '24': 124608,
                '30': 0,
            },
            membersNumber: 8,
            members: {
                '1': 6392,
                '12': 67104,
                '15': 0,
                '24': 124608,
                '30': 0,
            },
            plans: {
                '1': 799,
                '12': 8388,
                '15': 0,
                '24': 15576,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for Bundle Pro: no addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE_PRO]: 1,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.BUNDLE_PRO]);

        const expected = {
            all: {
                '1': 1299,
                '12': 13188,
                '15': 0,
                '24': 23976,
                '30': 0,
            },
            membersNumber: 1,
            members: {
                '1': 1299,
                '12': 13188,
                '15': 0,
                '24': 23976,
                '30': 0,
            },
            plans: {
                '1': 1299,
                '12': 13188,
                '15': 0,
                '24': 23976,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for Bundle Pro: with addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 7,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 9,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [
            PLANS.BUNDLE_PRO,
            ADDON_NAMES.MEMBER_BUNDLE_PRO,
            ADDON_NAMES.DOMAIN_BUNDLE_PRO,
        ]);

        const expected = {
            all: {
                '1': 11742,
                '12': 120624,
                '15': 0,
                '24': 219888,
                '30': 0,
            },
            membersNumber: 8,
            members: {
                '1': 10392,
                '12': 105504,
                '15': 0,
                '24': 191808,
                '30': 0,
            },
            plans: {
                '1': 1299,
                '12': 13188,
                '15': 0,
                '24': 23976,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for Family', () => {
        const planIDs: PlanIDs = {
            [PLANS.FAMILY]: 1,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.FAMILY]);

        const expected = {
            all: {
                '1': 2999,
                '12': 28788,
                '15': 0,
                '24': 47976,
                '30': 0,
            },
            // Even though Family Plan does have up to 6 users, we still count as 1 member for price displaying
            // purposes
            membersNumber: 1,
            members: {
                '1': 2999,
                '12': 28788,
                '15': 0,
                '24': 47976,
                '30': 0,
            },
            plans: {
                '1': 2999,
                '12': 28788,
                '15': 0,
                '24': 47976,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for VPN Essentials: no addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.VPN_PRO]: 1,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.VPN_PRO]);

        const expected = {
            all: {
                '1': 1798,
                '12': 16776,
                '15': 0,
                '24': 28752,
                '30': 0,
            },
            membersNumber: 2,
            members: {
                '1': 1798,
                '12': 16776,
                '15': 0,
                '24': 28752,
                '30': 0,
            },
            plans: {
                '1': 1798,
                '12': 16776,
                '15': 0,
                '24': 28752,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for VPN Essentials: with addons', () => {
        const planIDs: PlanIDs = {
            // be default VPN Pro has 2 members, so overall there's 9 members for the price calculation purposes
            [PLANS.VPN_PRO]: 1,
            [ADDON_NAMES.MEMBER_VPN_PRO]: 7,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.VPN_PRO, ADDON_NAMES.MEMBER_VPN_PRO]);

        const expected = {
            all: {
                '1': 8084,
                '12': 75492,
                '15': 0,
                '24': 129384,
                '30': 0,
            },
            membersNumber: 9,
            members: {
                '1': 8084,
                '12': 75492,
                '15': 0,
                '24': 129384,
                '30': 0,
            },
            plans: {
                '1': 1798,
                '12': 16776,
                '15': 0,
                '24': 28752,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for VPN Business: no addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.VPN_BUSINESS]: 1,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [PLANS.VPN_BUSINESS]);

        // VPN Business has 2 members and 1 IP by default.
        // monthly: each user currently costs 11.99 and IP 49.99.
        // yearly: (2*9.99 + 39.99) * 12
        // 2 years: (2*8.99 + 35.99) * 24
        const expected = {
            all: {
                '1': 7397,
                '12': 71964,
                '15': 0,
                '24': 129528,
                '30': 0,
            },
            membersNumber: 2,
            members: {
                '1': 2398,
                '12': 23976,
                '15': 0,
                '24': 43152,
                '30': 0,
            },
            plans: {
                '1': 7397,
                '12': 71964,
                '15': 0,
                '24': 129528,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });

    it('should return correct pricing for VPN Business: with addons', () => {
        const planIDs: PlanIDs = {
            [PLANS.VPN_BUSINESS]: 1,
            [ADDON_NAMES.MEMBER_VPN_BUSINESS]: 7,
            [ADDON_NAMES.IP_VPN_BUSINESS]: 3,
        };

        const plansMap: PlansMap = pick(PLANS_MAP, [
            PLANS.VPN_BUSINESS,
            ADDON_NAMES.MEMBER_VPN_BUSINESS,
            ADDON_NAMES.IP_VPN_BUSINESS,
        ]);

        // VPN Business has 2 members and 1 IP by default.
        // monthly: each user currently costs 11.99 and IP 49.99.
        // yearly: (2*9.99 + 39.99) * 12
        // 2 years: (2*8.99 + 35.99) * 24
        const expected = {
            all: {
                '1': 30787,
                '12': 299844,
                '15': 0,
                '24': 539688,
                '30': 0,
            },
            // Pricing for 9 members
            membersNumber: 9,
            members: {
                '1': 10791,
                '12': 107892,
                '15': 0,
                '24': 194184,
                '30': 0,
            },
            plans: {
                '1': 7397,
                '12': 71964,
                '15': 0,
                '24': 129528,
                '30': 0,
            },
        };

        const result = getPricingFromPlanIDs(planIDs, plansMap);

        expect(result).toEqual(expected);
    });
});

describe('getTotalFromPricing', () => {
    it('should calculate the prices correctly', () => {
        const pricing = {
            all: {
                '1': 8596,
                '12': 83952,
                '15': 0,
                '24': 151104,
                '30': 0,
            },
            members: {
                '1': 3597,
                '12': 35964,
                '15': 0,
                '24': 64728,
                '30': 0,
            },
            membersNumber: 3,
            plans: {
                '1': 7397,
                '12': 71964,
                '15': 0,
                '24': 129528,
                '30': 0,
            },
        };

        expect(getTotalFromPricing(pricing, 1)).toEqual({
            discount: 0,
            discountPercentage: 0,
            total: 8596,
            totalPerMonth: 8596,
            totalNoDiscountPerMonth: 8596,
            perUserPerMonth: 1199,
        });

        expect(getTotalFromPricing(pricing, 12)).toEqual({
            discount: 19200,
            discountPercentage: 19,
            total: 83952,
            totalPerMonth: 6996,
            totalNoDiscountPerMonth: 8596,
            perUserPerMonth: 999,
        });

        expect(getTotalFromPricing(pricing, 24)).toEqual({
            discount: 55200,
            discountPercentage: 27,
            total: 151104,
            totalPerMonth: 6296,
            totalNoDiscountPerMonth: 8596,
            perUserPerMonth: 899,
        });
    });
});
