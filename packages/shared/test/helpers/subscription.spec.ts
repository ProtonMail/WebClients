import { addWeeks } from 'date-fns';

import { ADDON_NAMES, CYCLE, PLANS } from '@proton/payments';
import type { Plan, Subscription, SubscriptionPlan } from '@proton/shared/lib/interfaces';
import { BillingPlatform, ChargebeeEnabled, External, Renew } from '@proton/shared/lib/interfaces';
// still uses Karma. The payments data specifically don't need jest, so it's safe to impoet it directly
import { getSubscriptionMock, getUserMock } from '@proton/testing/data';

import { COUPON_CODES } from '../../lib/constants';
import {
    allCycles,
    customCycles,
    getNormalCycleFromCustomCycle,
    getPlanIDs,
    hasCancellablePlan,
    hasLifetimeCoupon,
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

        expect(hasLifetimeCoupon(subscription)).toBe(true);
    });

    it('should not have LIFETIME', () => {
        subscription = {
            ...subscription,
            CouponCode: 'PANDA',
        };

        expect(hasLifetimeCoupon(subscription)).toBe(false);
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

describe('hasSomeAddOn', () => {
    it('Should test a single add-on Name', () => {
        subscription = {
            ...subscription,
            Plans: [...subscription.Plans, { ...defaultPlan, Name: ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO, Quantity: 1 }],
        };

        const result = hasSomeAddonOrPlan(subscription, ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO);
        expect(result).toEqual(true);
    });

    it('Should test a list of add-on Name', () => {
        subscription = {
            ...subscription,
            Plans: [...subscription.Plans, { ...defaultPlan, Name: ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO, Quantity: 1 }],
        };

        const result = hasSomeAddonOrPlan(subscription, [
            ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO,
            ADDON_NAMES.MEMBER_DRIVE_PRO,
        ]);
        expect(result).toEqual(true);
    });

    it('Should test a list of add-on Name with no match', () => {
        subscription = {
            ...subscription,
            Plans: [...subscription.Plans, { ...defaultPlan, Name: ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO, Quantity: 1 }],
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
            PLANS.WALLET,
        ];

        const subscription = getSubscriptionMock({ BillingPlatform: BillingPlatform.Proton });
        const user = getUserMock({ ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED, ChargebeeUserExists: 1 });

        testCases.forEach((plan) => {
            subscription.Plans[0].Name = plan;
            expect(hasCancellablePlan(subscription, user)).withContext(`plan: ${plan}`).toEqual(true);
        });
    });

    it('should not be cancellable if plan is non-cancellable', () => {
        const testCases = [PLANS.VPN_BUSINESS, PLANS.VPN_PRO];

        const subscription = getSubscriptionMock({ BillingPlatform: BillingPlatform.Proton });
        const user = getUserMock({ ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED, ChargebeeUserExists: 1 });

        testCases.forEach((plan) => {
            subscription.Plans[0].Name = plan;
            expect(hasCancellablePlan(subscription, user)).withContext(`plan: ${plan}`).toEqual(false);
        });
    });

    it('should not be cancellable if plan is bundle pro with IP addon', () => {
        const subscription = getSubscriptionMock({ BillingPlatform: BillingPlatform.Proton });
        const user = getUserMock({ ChargebeeUser: ChargebeeEnabled.CHARGEBEE_FORCED, ChargebeeUserExists: 1 });

        const testCases = [
            {
                plan: PLANS.BUNDLE_PRO,
                addon: ADDON_NAMES.IP_BUNDLE_PRO,
            },
            {
                plan: PLANS.BUNDLE_PRO_2024,
                addon: ADDON_NAMES.IP_BUNDLE_PRO_2024,
            },
        ];

        testCases.forEach((testCase) => {
            subscription.Plans[0].Name = testCase.plan;
            subscription.Plans.push({ Name: testCase.addon, Quantity: 1 } as Plan);
            expect(hasCancellablePlan(subscription, user))
                .withContext(`plan: ${testCase.plan}, addon: ${testCase.addon}`)
                .toEqual(false);
        });
    });
});
