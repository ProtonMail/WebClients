import { addWeeks } from 'date-fns';

import { SelectedPlan } from '@proton/payments';
import { pick } from '@proton/shared/lib/helpers/object';
import {
    getPlanFromIds,
    getPlanNameFromIDs,
    getPricingFromPlanIDs,
    getTotalFromPricing,
} from '@proton/shared/lib/helpers/planIDs';
import type {
    PlanIDs,
    PlansMap,
    Subscription,
    SubscriptionCheckResponse,
    SubscriptionPlan,
} from '@proton/shared/lib/interfaces';
import { BillingPlatform, ChargebeeEnabled, External, Renew } from '@proton/shared/lib/interfaces';
// that has to be a very granular import, because in general @proton/testing depends on jest while @proton/shared
// still uses Karma. The payments data specifically don't need jest, so it's safe to impoet it directly
import { PLANS_MAP, getSubscriptionMock, getUserMock } from '@proton/testing/data';

import { ADDON_NAMES, COUPON_CODES, CYCLE, PLANS } from '../../lib/constants';
import type { AggregatedPricing } from '../../lib/helpers/subscription';
import {
    allCycles,
    customCycles,
    getNormalCycleFromCustomCycle,
    getPlanIDs,
    hasCancellablePlan,
    hasLifetime,
    hasSomeAddonOrPlan,
    isManagedExternally,
    isTrial,
    isTrialExpired,
    regularCycles,
    willTrialExpire,
} from '../../lib/helpers/subscription';

let subscription: Subscription;
let defaultPlan: SubscriptionPlan;

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
        RenewDiscount: 123,
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
        State: 123,
        Offer: 'default',
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
    it('should be a trial - V4', () => {
        expect(isTrial({ ...subscription, CouponCode: COUPON_CODES.REFERRAL })).toBe(true);
    });

    it('should not be a trial - V4', () => {
        expect(isTrial({ ...subscription, CouponCode: 'PANDA' })).toBe(false);
    });

    it('should be a trial - V5', () => {
        expect(isTrial({ ...subscription, IsTrial: true })).toBe(true);
        expect(isTrial({ ...subscription, IsTrial: 1 as any })).toBe(true);
    });

    it('should not be a trial - V5', () => {
        expect(isTrial({ ...subscription, IsTrial: false })).toBe(false);
        expect(isTrial({ ...subscription, IsTrial: 0 as any })).toBe(false);
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
                ParentMetaPlanID: '',
                Type: 1,
                Name: PLANS.PASS,
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
                PeriodEnd: {
                    '1': 1678452604,
                    '12': 1707569404,
                    '24': 1739191804,
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

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 499,
            defaultMonthlyPriceWithoutAddons: 499,
            all: {
                '1': 499,
                '3': 0,
                '12': 1200,
                '15': 0,
                '18': 0,
                '24': 7176,
                '30': 0,
            },
            membersNumber: 1,
            members: {
                '1': 499,
                '3': 0,
                '12': 1200,
                '15': 0,
                '18': 0,
                '24': 7176,
                '30': 0,
            },
            plans: {
                '1': 499,
                '3': 0,
                '12': 1200,
                '15': 0,
                '18': 0,
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

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 799,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            membersNumber: 1,
            members: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
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

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 6392,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 6392,
                '3': 0,
                '12': 67104,
                '15': 0,
                '18': 0,
                '24': 124608,
                '30': 0,
            },
            membersNumber: 8,
            members: {
                '1': 6392,
                '3': 0,
                '12': 67104,
                '15': 0,
                '18': 0,
                '24': 124608,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
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

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 1299,
            defaultMonthlyPriceWithoutAddons: 1299,
            all: {
                '1': 1299,
                '3': 0,
                '12': 13188,
                '15': 0,
                '18': 0,
                '24': 23976,
                '30': 0,
            },
            membersNumber: 1,
            members: {
                '1': 1299,
                '3': 0,
                '12': 13188,
                '15': 0,
                '18': 0,
                '24': 23976,
                '30': 0,
            },
            plans: {
                '1': 1299,
                '3': 0,
                '12': 13188,
                '15': 0,
                '18': 0,
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

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 11742,
            defaultMonthlyPriceWithoutAddons: 1299,
            all: {
                '1': 11742,
                '3': 0,
                '12': 120624,
                '15': 0,
                '18': 0,
                '24': 219888,
                '30': 0,
            },
            membersNumber: 8,
            members: {
                '1': 10392,
                '3': 0,
                '12': 105504,
                '15': 0,
                '18': 0,
                '24': 191808,
                '30': 0,
            },
            plans: {
                '1': 1299,
                '3': 0,
                '12': 13188,
                '15': 0,
                '18': 0,
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

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 2999,
            defaultMonthlyPriceWithoutAddons: 2999,
            all: {
                '1': 2999,
                '3': 0,
                '12': 28788,
                '15': 0,
                '18': 0,
                '24': 47976,
                '30': 0,
            },
            // Even though Family Plan does have up to 6 users, we still count as 1 member for price displaying
            // purposes
            membersNumber: 1,
            members: {
                '1': 2999,
                '3': 0,
                '12': 28788,
                '15': 0,
                '18': 0,
                '24': 47976,
                '30': 0,
            },
            plans: {
                '1': 2999,
                '3': 0,
                '12': 28788,
                '15': 0,
                '18': 0,
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

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 1798,
            defaultMonthlyPriceWithoutAddons: 1798,
            all: {
                '1': 1798,
                '3': 0,
                '12': 16776,
                '15': 0,
                '18': 0,
                '24': 28752,
                '30': 0,
            },
            membersNumber: 2,
            members: {
                '1': 1798,
                '3': 0,
                '12': 16776,
                '15': 0,
                '18': 0,
                '24': 28752,
                '30': 0,
            },
            plans: {
                '1': 1798,
                '3': 0,
                '12': 16776,
                '15': 0,
                '18': 0,
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

        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 8091,
            defaultMonthlyPriceWithoutAddons: 1798,
            all: {
                '1': 8091,
                '3': 0,
                '12': 75492,
                '15': 0,
                '18': 0,
                '24': 129384,
                '30': 0,
            },
            membersNumber: 9,
            members: {
                '1': 8091,
                '3': 0,
                '12': 75492,
                '15': 0,
                '18': 0,
                '24': 129384,
                '30': 0,
            },
            plans: {
                '1': 1798,
                '3': 0,
                '12': 16776,
                '15': 0,
                '18': 0,
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
        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 7397,
            defaultMonthlyPriceWithoutAddons: 7397,
            all: {
                '1': 7397,
                '3': 0,
                '12': 71964,
                '15': 0,
                '18': 0,
                '24': 129528,
                '30': 0,
            },
            membersNumber: 2,
            members: {
                '1': 2398,
                '3': 0,
                '12': 23976,
                '15': 0,
                '18': 0,
                '24': 43152,
                '30': 0,
            },
            plans: {
                '1': 7397,
                '3': 0,
                '12': 71964,
                '15': 0,
                '18': 0,
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
        const expected: AggregatedPricing = {
            defaultMonthlyPrice: 30787,
            defaultMonthlyPriceWithoutAddons: 7397,
            all: {
                '1': 30787,
                '3': 0,
                '12': 299844,
                '15': 0,
                '18': 0,
                '24': 539688,
                '30': 0,
            },
            // Pricing for 9 members
            membersNumber: 9,
            members: {
                '1': 10791,
                '3': 0,
                '12': 107892,
                '15': 0,
                '18': 0,
                '24': 194184,
                '30': 0,
            },
            plans: {
                '1': 7397,
                '3': 0,
                '12': 71964,
                '15': 0,
                '18': 0,
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
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 8596,
            defaultMonthlyPriceWithoutAddons: 499,
            all: {
                '1': 8596,
                '3': 0,
                '12': 83952,
                '15': 0,
                '18': 0,
                '24': 151104,
                '30': 0,
            },
            members: {
                '1': 3597,
                '3': 0,
                '12': 35964,
                '15': 0,
                '18': 0,
                '24': 64728,
                '30': 0,
            },
            membersNumber: 3,
            plans: {
                '1': 7397,
                '3': 0,
                '12': 71964,
                '15': 0,
                '18': 0,
                '24': 129528,
                '30': 0,
            },
        };

        expect(getTotalFromPricing(pricing, 1)).toEqual({
            discount: 0,
            discountPercentage: 0,
            discountedTotal: 8596,
            totalPerMonth: 8596,
            totalNoDiscountPerMonth: 8596,
            perUserPerMonth: 1199,
            viewPricePerMonth: 8596,
        });

        expect(getTotalFromPricing(pricing, 12)).toEqual({
            discount: 19200,
            discountPercentage: 19,
            discountedTotal: 83952,
            totalPerMonth: 6996,
            totalNoDiscountPerMonth: 8596,
            perUserPerMonth: 999,
            viewPricePerMonth: 6996,
        });

        expect(getTotalFromPricing(pricing, 24)).toEqual({
            discount: 55200,
            discountPercentage: 27,
            discountedTotal: 151104,
            totalPerMonth: 6296,
            totalNoDiscountPerMonth: 8596,
            perUserPerMonth: 899,
            viewPricePerMonth: 6296,
        });
    });

    it('should calculate the prices correctly from a different monthly price', () => {
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 999,
            defaultMonthlyPriceWithoutAddons: 499,
            all: {
                '1': 899,
                '3': 0,
                '12': 7188,
                '15': 14985,
                '18': 0,
                '24': 11976,
                '30': 29970,
            },
            members: {
                '1': 899,
                '3': 0,
                '12': 7188,
                '15': 14985,
                '18': 0,
                '24': 11976,
                '30': 29970,
            },
            plans: {
                '1': 899,
                '3': 0,
                '12': 7188,
                '15': 14985,
                '18': 0,
                '24': 11976,
                '30': 29970,
            },
            membersNumber: 1,
        };

        expect(getTotalFromPricing(pricing, 1)).toEqual({
            discount: 0,
            discountPercentage: 0,
            discountedTotal: 899,
            totalPerMonth: 899,
            totalNoDiscountPerMonth: 999,
            perUserPerMonth: 899,
            viewPricePerMonth: 899,
        });

        expect(getTotalFromPricing(pricing, 12)).toEqual({
            discount: 4800,
            discountPercentage: 40,
            discountedTotal: 7188,
            totalPerMonth: 599,
            totalNoDiscountPerMonth: 999,
            perUserPerMonth: 599,
            viewPricePerMonth: 599,
        });

        expect(getTotalFromPricing(pricing, 24)).toEqual({
            discount: 12000,
            discountPercentage: 50,
            discountedTotal: 11976,
            totalPerMonth: 499,
            totalNoDiscountPerMonth: 999,
            perUserPerMonth: 499,
            viewPricePerMonth: 499,
        });
    });

    it('should calculate the prices correctly - Mail Essentials', () => {
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 799,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            members: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            membersNumber: 1,
        };

        const selectedPlan = new SelectedPlan({ [PLANS.MAIL_PRO]: 1 }, PLANS_MAP, CYCLE.YEARLY, 'USD');
        expect(getTotalFromPricing(pricing, 12, 'all', [], selectedPlan)).toEqual({
            discount: 1200,
            discountedTotal: 8388,
            perUserPerMonth: 699,
            viewPricePerMonth: 699,
            discountPercentage: 13,
            totalPerMonth: 699,
            totalNoDiscountPerMonth: 799,
        });
    });

    it('should calculate the prices correctly - Mail Essentials with scribe', () => {
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 1198,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 1198,
                '3': 0,
                '12': 11976,
                '15': 0,
                '18': 0,
                '24': 22752,
                '30': 0,
            },
            members: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            membersNumber: 1,
        };

        const selectedPlan = new SelectedPlan(
            { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1 },
            PLANS_MAP,
            CYCLE.YEARLY,
            'USD'
        );
        expect(getTotalFromPricing(pricing, 12, 'all', [], selectedPlan)).toEqual({
            discount: 2400,
            discountedTotal: 11976,
            perUserPerMonth: 699,
            viewPricePerMonth: 699,
            discountPercentage: 17,
            totalPerMonth: 998,
            totalNoDiscountPerMonth: 1198,
        });
    });

    it('should calculate the prices correctly - Mail Essentials with discount', () => {
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 799,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            members: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            membersNumber: 1,
        };

        const selectedPlan = new SelectedPlan({ [PLANS.MAIL_PRO]: 1 }, PLANS_MAP, CYCLE.YEARLY, 'USD');
        expect(
            getTotalFromPricing(
                pricing,
                12,
                'all',
                [
                    {
                        Amount: 799,
                        Currency: 'USD',
                        AmountDue: 0,
                        Proration: 0,
                        CouponDiscount: -200,
                        Gift: 0,
                        Credit: -599,
                        UnusedCredit: 0,
                        Coupon: {
                            Code: 'ONETEST25',
                            Description: 'One-time 25% discount',
                            MaximumRedemptionsPerUser: 1,
                        },
                        Cycle: 1,
                        SubscriptionMode: 0,
                        TaxInclusive: 1,
                        Taxes: [
                            {
                                Name: 'Mehrwertsteuer (MWST)',
                                Rate: 8.1,
                                Amount: 45,
                            },
                        ],
                        PeriodEnd: 0,
                    },
                    {
                        Amount: 8388,
                        Currency: 'USD',
                        AmountDue: 0,
                        Proration: 0,
                        CouponDiscount: -2097,
                        Gift: 0,
                        Credit: -6291,
                        UnusedCredit: 0,
                        Coupon: {
                            Code: 'ONETEST25',
                            Description: 'One-time 25% discount',
                            MaximumRedemptionsPerUser: 1,
                        },
                        Cycle: 12,
                        SubscriptionMode: 0,
                        TaxInclusive: 1,
                        Taxes: [
                            {
                                Name: 'Mehrwertsteuer (MWST)',
                                Rate: 8.1,
                                Amount: 471,
                            },
                        ],
                        PeriodEnd: 0,
                    },
                ],
                selectedPlan
            )
        ).toEqual({
            discount: 3297,
            discountedTotal: 6291,
            perUserPerMonth: 524.25,
            viewPricePerMonth: 524.25,
            discountPercentage: 34,
            totalPerMonth: 524.25,
            totalNoDiscountPerMonth: 799,
        });
    });

    it('should calculate the prices correctly - Mail Essentials with discount and scribe', () => {
        const pricing: AggregatedPricing = {
            defaultMonthlyPrice: 1198,
            defaultMonthlyPriceWithoutAddons: 799,
            all: {
                '1': 1198,
                '3': 0,
                '12': 11976,
                '15': 0,
                '18': 0,
                '24': 22752,
                '30': 0,
            },
            members: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            plans: {
                '1': 799,
                '3': 0,
                '12': 8388,
                '15': 0,
                '18': 0,
                '24': 15576,
                '30': 0,
            },
            membersNumber: 1,
        };

        const cycle = CYCLE.YEARLY;
        const mode = 'all';
        const checkResults: SubscriptionCheckResponse[] = [
            {
                PeriodEnd: 0,
                Amount: 1198,
                Currency: 'USD',
                AmountDue: 0,
                Proration: 0,
                CouponDiscount: -300,
                Gift: 0,
                Credit: -898,
                UnusedCredit: 0,
                Coupon: {
                    Code: 'ONETEST25',
                    Description: 'One-time 25% discount',
                    MaximumRedemptionsPerUser: 1,
                },
                Cycle: 1,
                SubscriptionMode: 0,
                TaxInclusive: 1,
                Taxes: [
                    {
                        Name: 'Mehrwertsteuer (MWST)',
                        Rate: 8.1,
                        Amount: 67,
                    },
                ],
            },
            {
                PeriodEnd: 0,
                Amount: 11976,
                Currency: 'USD',
                AmountDue: 0,
                Proration: 0,
                CouponDiscount: -2994,
                Gift: 0,
                Credit: -8982,
                UnusedCredit: 0,
                Coupon: {
                    Code: 'ONETEST25',
                    Description: 'One-time 25% discount',
                    MaximumRedemptionsPerUser: 1,
                },
                Cycle: 12,
                SubscriptionMode: 0,
                TaxInclusive: 1,
                Taxes: [
                    {
                        Name: 'Mehrwertsteuer (MWST)',
                        Rate: 8.1,
                        Amount: 673,
                    },
                ],
            },
        ];
        const selectedPlan = new SelectedPlan(
            { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1 },
            PLANS_MAP,
            cycle,
            'USD'
        );

        expect(getTotalFromPricing(pricing, 12, mode, checkResults, selectedPlan)).toEqual({
            discount: 5394,
            discountPercentage: 38,
            discountedTotal: 8982,
            totalPerMonth: 748.5,
            totalNoDiscountPerMonth: 1198,
            perUserPerMonth: 524.25,
            viewPricePerMonth: 524.25,
        });
    });
});

describe('getPlanFromIds', () => {
    it('should return the correct plan when it exists in planIDs', () => {
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE_PRO]: 1,
        };

        const result = getPlanFromIds(planIDs);
        expect(result).toEqual(PLANS.BUNDLE_PRO);
    });

    it('should return undefined when no plan exists in planIDs', () => {
        const planIDs: PlanIDs = {};

        const result = getPlanFromIds(planIDs);
        expect(result).toBeUndefined();
    });

    it('should choose the plan instead of addons', () => {
        const planIDs: PlanIDs = {
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 1,
            [ADDON_NAMES.DOMAIN_BUNDLE_PRO]: 1,
            [PLANS.BUNDLE_PRO]: 1,
        };

        const result = getPlanFromIds(planIDs);
        expect(result).toEqual(PLANS.BUNDLE_PRO);
    });
});

describe('getPlanNameFromIDs', () => {
    it('should return the correct plan name', () => {
        const planIDs: PlanIDs = {
            [PLANS.VPN_PRO]: 1,
            [ADDON_NAMES.MEMBER_VPN_PRO]: 12,
        };

        // these two checks are equivalent. I wanted to add them for expressiveness and readability
        expect(getPlanNameFromIDs(planIDs)).toEqual('vpnpro2023' as any);
        expect(getPlanNameFromIDs(planIDs)).toEqual(PLANS.VPN_PRO);
    });

    it('should return undefined if there are no plan IDs', () => {
        expect(getPlanNameFromIDs({})).toBeUndefined();
    });
});

describe('hasSomeAddOn', () => {
    it('Should test a single add-on Name', () => {
        subscription = {
            ...subscription,
            Plans: [...subscription.Plans, { ...defaultPlan, Name: ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS, Quantity: 1 }],
        };

        const result = hasSomeAddonOrPlan(subscription, ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS);
        expect(result).toEqual(true);
    });

    it('Should test a list of add-on Name', () => {
        subscription = {
            ...subscription,
            Plans: [...subscription.Plans, { ...defaultPlan, Name: ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS, Quantity: 1 }],
        };

        const result = hasSomeAddonOrPlan(subscription, [
            ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS,
            ADDON_NAMES.MEMBER_DRIVE_PRO,
        ]);
        expect(result).toEqual(true);
    });

    it('Should test a list of add-on Name with no match', () => {
        subscription = {
            ...subscription,
            Plans: [...subscription.Plans, { ...defaultPlan, Name: ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS, Quantity: 1 }],
        };

        const result = hasSomeAddonOrPlan(subscription, [ADDON_NAMES.MEMBER_DRIVE_PRO, ADDON_NAMES.MEMBER_VPN_PRO]);
        expect(result).toEqual(false);
    });
});

describe('cycles', () => {
    it('should have all cycles', () => {
        expect(allCycles).toEqual([
            CYCLE.MONTHLY,
            CYCLE.THREE,
            CYCLE.YEARLY,
            CYCLE.FIFTEEN,
            CYCLE.EIGHTEEN,
            CYCLE.TWO_YEARS,
            CYCLE.THIRTY,
        ]);
    });

    it('should have regular cycles', () => {
        expect(regularCycles).toEqual([CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS]);
    });

    it('should have custom cycles', () => {
        expect(customCycles).toEqual([CYCLE.THREE, CYCLE.FIFTEEN, CYCLE.EIGHTEEN, CYCLE.THIRTY]);
    });

    it('should return normal cycle from custom cycle - undefined', () => {
        expect(getNormalCycleFromCustomCycle(undefined)).toEqual(undefined);
    });

    it('should return normal cycle from custom cycle - monthly', () => {
        expect(getNormalCycleFromCustomCycle(CYCLE.THREE)).toEqual(CYCLE.MONTHLY);
    });

    it('should return normal cycle from custom cycle - three', () => {
        expect(getNormalCycleFromCustomCycle(CYCLE.THREE)).toEqual(CYCLE.MONTHLY);
    });

    it('should return normal cycle from custom cycle - yearly', () => {
        expect(getNormalCycleFromCustomCycle(CYCLE.YEARLY)).toEqual(CYCLE.YEARLY);
    });

    it('should return normal cycle from custom cycle - fifteen', () => {
        expect(getNormalCycleFromCustomCycle(CYCLE.FIFTEEN)).toEqual(CYCLE.YEARLY);
    });

    it('should return normal cycle from custom cycle - eighteen', () => {
        expect(getNormalCycleFromCustomCycle(CYCLE.EIGHTEEN)).toEqual(CYCLE.YEARLY);
    });

    it('should return normal cycle from custom cycle - two years', () => {
        expect(getNormalCycleFromCustomCycle(CYCLE.TWO_YEARS)).toEqual(CYCLE.TWO_YEARS);
    });

    it('should return normal cycle from custom cycle - thirty', () => {
        expect(getNormalCycleFromCustomCycle(CYCLE.THIRTY)).toEqual(CYCLE.TWO_YEARS);
    });
});

describe('hasCancellablePlan', () => {
    it('should be cancellable with inhouse subscription', () => {
        const testCases = [PLANS.PASS, PLANS.VPN, PLANS.VPN2024, PLANS.VPN_PASS_BUNDLE];

        const subscription = getSubscriptionMock({ BillingPlatform: BillingPlatform.Proton });

        const user = getUserMock({ ChargebeeUser: ChargebeeEnabled.INHOUSE_FORCED, ChargebeeUserExists: 0 });

        testCases.forEach((plan) => {
            subscription.Plans[0].Name = plan;
            expect(hasCancellablePlan(subscription, user)).toEqual(true);
        });
    });

    it('should not be cancellable with inhouse subscription', () => {
        const testCases = [
            PLANS.BUNDLE,
            PLANS.BUNDLE_PRO,
            PLANS.BUNDLE_PRO_2024,
            PLANS.DRIVE,
            PLANS.DRIVE_PRO,
            PLANS.DUO,
            PLANS.ENTERPRISE,
            PLANS.FAMILY,
            PLANS.FREE,
            PLANS.MAIL,
            PLANS.MAIL_BUSINESS,
            PLANS.MAIL_PRO,
            PLANS.PASS_BUSINESS,
            PLANS.PASS_PRO,
            PLANS.VISIONARY,
            PLANS.VPN_BUSINESS,
            PLANS.VPN_PRO,
            PLANS.WALLET,
        ];

        const subscription = getSubscriptionMock({ BillingPlatform: BillingPlatform.Proton });

        const user = getUserMock({ ChargebeeUser: ChargebeeEnabled.INHOUSE_FORCED, ChargebeeUserExists: 0 });

        testCases.forEach((plan) => {
            subscription.Plans[0].Name = plan;
            expect(hasCancellablePlan(subscription, user)).withContext(`plan: ${plan}`).toEqual(false);
        });
    });

    it('should have cancellable plan if user is on-session migration eligible', () => {
        const testCases = [PLANS.PASS, PLANS.VPN, PLANS.VPN2024, PLANS.VPN_PASS_BUNDLE];

        const subscription = getSubscriptionMock({ BillingPlatform: BillingPlatform.Proton });
        const user = getUserMock({ ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED, ChargebeeUserExists: 0 });

        testCases.forEach((plan) => {
            subscription.Plans[0].Name = plan;
            expect(hasCancellablePlan(subscription, user)).withContext(`plan: ${plan}`).toEqual(true);
        });
    });

    it('should not have cancellable plan if user is on-session migration eligible', () => {
        const testCases = [
            PLANS.BUNDLE,
            PLANS.BUNDLE_PRO,
            PLANS.BUNDLE_PRO_2024,
            PLANS.DRIVE,
            PLANS.DRIVE_PRO,
            PLANS.DUO,
            PLANS.ENTERPRISE,
            PLANS.FAMILY,
            PLANS.FREE,
            PLANS.MAIL,
            PLANS.MAIL_BUSINESS,
            PLANS.MAIL_PRO,
            PLANS.PASS_BUSINESS,
            PLANS.PASS_PRO,
            PLANS.VISIONARY,
            PLANS.VPN_BUSINESS,
            PLANS.VPN_PRO,
            PLANS.WALLET,
        ];

        const subscription = getSubscriptionMock({ BillingPlatform: BillingPlatform.Proton });
        const user = getUserMock({ ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED, ChargebeeUserExists: 0 });

        testCases.forEach((plan) => {
            subscription.Plans[0].Name = plan;
            expect(hasCancellablePlan(subscription, user)).withContext(`plan: ${plan}`).toEqual(false);
        });
    });

    it('should have all plans cancellable if user is true chargebee user', () => {
        const testCases = [
            PLANS.PASS,
            PLANS.VPN,
            PLANS.VPN2024,
            PLANS.VPN_PASS_BUNDLE,
            // ---
            PLANS.BUNDLE,
            PLANS.BUNDLE_PRO,
            PLANS.BUNDLE_PRO_2024,
            PLANS.DRIVE,
            PLANS.DRIVE_PRO,
            PLANS.DUO,
            PLANS.ENTERPRISE,
            PLANS.FAMILY,
            PLANS.FREE,
            PLANS.MAIL,
            PLANS.MAIL_BUSINESS,
            PLANS.MAIL_PRO,
            PLANS.PASS_BUSINESS,
            PLANS.PASS_PRO,
            PLANS.VISIONARY,
            PLANS.VPN_BUSINESS,
            PLANS.VPN_PRO,
            PLANS.WALLET,
        ];

        const subscription = getSubscriptionMock({ BillingPlatform: BillingPlatform.Chargebee });
        const user = getUserMock({ ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED, ChargebeeUserExists: 1 });

        testCases.forEach((plan) => {
            subscription.Plans[0].Name = plan;
            expect(hasCancellablePlan(subscription, user)).withContext(`plan: ${plan}`).toEqual(true);
        });
    });

    it('should have all plans cancellable if user is splitted', () => {
        const testCases = [
            PLANS.PASS,
            PLANS.VPN,
            PLANS.VPN2024,
            PLANS.VPN_PASS_BUNDLE,
            // ---
            PLANS.BUNDLE,
            PLANS.BUNDLE_PRO,
            PLANS.BUNDLE_PRO_2024,
            PLANS.DRIVE,
            PLANS.DRIVE_PRO,
            PLANS.DUO,
            PLANS.ENTERPRISE,
            PLANS.FAMILY,
            PLANS.FREE,
            PLANS.MAIL,
            PLANS.MAIL_BUSINESS,
            PLANS.MAIL_PRO,
            PLANS.PASS_BUSINESS,
            PLANS.PASS_PRO,
            PLANS.VISIONARY,
            PLANS.VPN_BUSINESS,
            PLANS.VPN_PRO,
            PLANS.WALLET,
        ];

        const subscription = getSubscriptionMock({ BillingPlatform: BillingPlatform.Proton });
        const user = getUserMock({ ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED, ChargebeeUserExists: 1 });

        testCases.forEach((plan) => {
            subscription.Plans[0].Name = plan;
            expect(hasCancellablePlan(subscription, user)).withContext(`plan: ${plan}`).toEqual(true);
        });
    });
});
