import {
    ADDON_NAMES,
    CYCLE,
    type Currency,
    DEFAULT_CURRENCY,
    FREE_SUBSCRIPTION,
    PLANS,
    type PlanIDs,
    isRegionalCurrency,
} from '@proton/payments';
import { COUPON_CODES } from '@proton/shared/lib/constants';
import type { Plan } from '@proton/shared/lib/interfaces';
import { PLANS_MAP, getSubscriptionMock, getTestPlansMap } from '@proton/testing/data';

import { type PlanCapRule, getAllowedCycles } from './getAllowedCycles';

const rulesWith24m: PlanCapRule[] = [
    { plan: ADDON_NAMES.MEMBER_MAIL_BUSINESS, cycle: CYCLE.YEARLY },

    { plan: ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS, cycle: CYCLE.YEARLY },
    { plan: ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO, cycle: CYCLE.YEARLY },
    { plan: ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO, cycle: CYCLE.YEARLY },
    { plan: ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024, cycle: CYCLE.YEARLY },

    { plan: PLANS.PASS, cycle: CYCLE.YEARLY },

    { plan: PLANS.PASS_PRO, cycle: CYCLE.YEARLY },
    { plan: PLANS.PASS_BUSINESS, cycle: CYCLE.YEARLY },
    // { plan: PLANS.MAIL_PRO, cycle: CYCLE.YEARLY },
    { plan: PLANS.MAIL_BUSINESS, cycle: CYCLE.YEARLY },
    { plan: PLANS.BUNDLE_PRO, cycle: CYCLE.YEARLY },
    { plan: PLANS.BUNDLE_PRO_2024, cycle: CYCLE.YEARLY },

    { plan: PLANS.MAIL, cycle: CYCLE.YEARLY, currencyPredicate: (currency) => isRegionalCurrency(currency) },
    { plan: PLANS.DRIVE, cycle: CYCLE.YEARLY, currencyPredicate: (currency) => isRegionalCurrency(currency) },
    { plan: PLANS.DUO, cycle: CYCLE.YEARLY, currencyPredicate: (currency) => isRegionalCurrency(currency) },
    { plan: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currencyPredicate: (currency) => isRegionalCurrency(currency) },
];

describe('getAllowedCycles', () => {
    it('should return all cycles if there is no subscription: with 24m rules', () => {
        const subscription = undefined;
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
        };

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
            rules: rulesWith24m,
        });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return all cycles if there is no subscription: with default rules', () => {
        const subscription = undefined;
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
        };

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return 1, 12 and 24 cycles when user has a 1-month subscription: with 24m rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
            rules: rulesWith24m,
        });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return 1, 12 and 24 cycles when user has a 1-month subscription: with default rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return 12 and 24 cycles when user has a 12-month subscription: with 24m rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.YEARLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
            rules: rulesWith24m,
        });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return 12 and 24 cycles when user has a 12-month subscription: with default rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.YEARLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY]);
    });

    it('should return only 24 cycle if user has 24 cycle subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should return 12 and 24 cycles if user has upcoming 12-cycle: with 24m rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const upcomingSubscriptionMock = getSubscriptionMock();
        upcomingSubscriptionMock.Cycle = CYCLE.YEARLY;
        subscription.UpcomingSubscription = upcomingSubscriptionMock;

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
            rules: rulesWith24m,
        });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return 12 and 24 cycles if user has upcoming 12-cycle: with default rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const upcomingSubscriptionMock = getSubscriptionMock();
        upcomingSubscriptionMock.Cycle = CYCLE.YEARLY;
        subscription.UpcomingSubscription = upcomingSubscriptionMock;

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY]);
    });

    it('should return all cycles if user has referral subscription: with 24m rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.CouponCode = COUPON_CODES.REFERRAL;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
            rules: rulesWith24m,
        });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return all cycles if user has referral subscription: with default rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.CouponCode = COUPON_CODES.REFERRAL;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return all cycles if user was downgraded: with 24m rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.CouponCode = COUPON_CODES.MEMBER_DOWNGRADE_TRIAL;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
            rules: rulesWith24m,
        });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return all cycles if user was downgraded: with default rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.CouponCode = COUPON_CODES.MEMBER_DOWNGRADE_TRIAL;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return all cycles if user has trial subscription: with 24m rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
            rules: rulesWith24m,
        });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return all cycles if user has trial subscription: with default rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return cycles respecting minimumCycle = 12 if user has trial subscription: with 24m rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.YEARLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
            rules: rulesWith24m,
        });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return cycles respecting minimumCycle = 12 if user has trial subscription: with default rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.YEARLY;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY]);
    });

    it('should return cycles respecting minimumCycle = 24 if user has trial subscription: with 24m rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.TWO_YEARS;
        const maximumCycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
            rules: rulesWith24m,
        });

        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should return cycles respecting minimumCycle = 12 if user has trial subscription: with default rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const minimumCycle = CYCLE.YEARLY;
        const maximumCycle = CYCLE.YEARLY;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY]);
    });

    it('should return all cycles if plan is changed: with 24m rules', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;
        const defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            defaultCycles,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should filter the plans if the addons changed', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.TWO_YEARS;
        subscription.Plans[0].Name = PLANS.BUNDLE_PRO;
        subscription.Plans.push({
            Name: ADDON_NAMES.MEMBER_BUNDLE_PRO,
            Quantity: 1,
        } as Plan);

        const planIDs: PlanIDs = {
            [PLANS.BUNDLE_PRO]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 2,
        };

        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;
        const defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            defaultCycles,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should return cycles respecting the minimumCycle = 12 if plan is changed', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
        };

        const minimumCycle = CYCLE.YEARLY;
        const maximumCycle = CYCLE.TWO_YEARS;
        const defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            defaultCycles,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return cycles respecting the minimumCycle = 24 if plan is changed', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
        };

        const minimumCycle = CYCLE.TWO_YEARS;
        const maximumCycle = CYCLE.TWO_YEARS;
        const defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            defaultCycles,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should return cycles respecting the maximumCycle = 12', () => {
        const subscription = getSubscriptionMock();
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.YEARLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        subscription.Cycle = CYCLE.MONTHLY;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });
        expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should allow the current cycle even if it is higher than maximum', () => {
        const subscription = getSubscriptionMock();
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.YEARLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        subscription.Cycle = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should allow upcoming cycle even if it is higher than maximum', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.YEARLY;
        const upcomingSubscription = getSubscriptionMock();
        upcomingSubscription.Cycle = CYCLE.TWO_YEARS;
        subscription.UpcomingSubscription = upcomingSubscription;
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.YEARLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS]);
    });

    it('should ignore upcoming cycle check with disableUpcomingCycleCheck', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.YEARLY;
        const upcomingSubscription = getSubscriptionMock();
        upcomingSubscription.Cycle = CYCLE.TWO_YEARS;
        subscription.UpcomingSubscription = upcomingSubscription;
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };
        const disableUpcomingCycleCheck = true;
        const result = getAllowedCycles({
            subscription,
            minimumCycle,
            maximumCycle,
            planIDs,
            disableUpcomingCycleCheck,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should not return cycles that are not available for the plan', () => {
        const result = getAllowedCycles({
            subscription: FREE_SUBSCRIPTION,
            minimumCycle: CYCLE.MONTHLY,
            maximumCycle: CYCLE.TWO_YEARS,
            planIDs: {
                [PLANS.WALLET]: 1,
            } as any,
            // this test assumes that wallet2024 does not have 24 cycle in PLANS_MAP
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should not return 1m cycle if it does not exist on the backend', () => {
        const customPlansMap = getTestPlansMap();
        customPlansMap[PLANS.MAIL] = {
            ...(customPlansMap[PLANS.MAIL] as Plan),
            Pricing: {
                [CYCLE.YEARLY]: customPlansMap[PLANS.MAIL]!.Pricing[CYCLE.YEARLY],
            },
            DefaultPricing: {
                [CYCLE.YEARLY]: customPlansMap[PLANS.MAIL]!.DefaultPricing?.[CYCLE.YEARLY],
            },
        };

        expect(Object.keys(customPlansMap[PLANS.MAIL]?.Pricing ?? {}).map((it) => +it)).toEqual([CYCLE.YEARLY]);
        expect(Object.keys(customPlansMap[PLANS.MAIL]?.DefaultPricing ?? {}).map((it) => +it)).toEqual([CYCLE.YEARLY]);

        const result = getAllowedCycles({
            subscription: FREE_SUBSCRIPTION,
            minimumCycle: CYCLE.MONTHLY,
            maximumCycle: CYCLE.TWO_YEARS,
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap: customPlansMap,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY]);
    });

    it('should return empty list if plan does not exist', () => {
        const result = getAllowedCycles({
            subscription: FREE_SUBSCRIPTION,
            minimumCycle: CYCLE.MONTHLY,
            maximumCycle: CYCLE.TWO_YEARS,
            planIDs: { ['somerandomplan' as any]: 1 },
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([]);
    });

    describe('defaultCycles', () => {
        it('should sort defaultCycles to TWO_YEARS, YEARLY, MONTHLY: with 24m rules', () => {
            const subscription = undefined;
            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;
            const defaultCycles = [CYCLE.YEARLY, CYCLE.MONTHLY, CYCLE.TWO_YEARS];
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                defaultCycles,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
                rules: rulesWith24m,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        });

        it('should sort defaultCycles to TWO_YEARS, YEARLY, MONTHLY: with default rules', () => {
            const subscription = undefined;
            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;
            const defaultCycles = [CYCLE.YEARLY, CYCLE.MONTHLY, CYCLE.TWO_YEARS];
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                defaultCycles,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
        });

        it('should sort default cycles in descending order: with 24m rules', () => {
            const subscription = undefined;
            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;
            const defaultCycles = [CYCLE.YEARLY, CYCLE.MONTHLY, CYCLE.TWO_YEARS];
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                defaultCycles,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
                rules: rulesWith24m,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        });

        it('should sort default cycles in descending order: with default rules', () => {
            const subscription = undefined;
            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;
            const defaultCycles = [CYCLE.YEARLY, CYCLE.MONTHLY, CYCLE.TWO_YEARS];
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                defaultCycles,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
        });

        it('should sort defaultCycles to THIRTY, FIFTEEN, MONTHLY: with 24m rules', () => {
            const subscription = undefined;
            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.THIRTY;
            const defaultCycles = [CYCLE.THIRTY, CYCLE.MONTHLY, CYCLE.FIFTEEN];
            const planIDs: PlanIDs = {
                [PLANS.VPN]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                defaultCycles,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
                rules: rulesWith24m,
            });

            expect(result).toEqual([CYCLE.THIRTY, CYCLE.FIFTEEN, CYCLE.MONTHLY]);
        });
    });

    describe('downcycling', () => {
        it('should return 1, 12 and 24 cycles when user has a 12-month subscription and downcyling is allowed: with 24m rules', () => {
            const subscription = getSubscriptionMock();
            subscription.Cycle = CYCLE.YEARLY;
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                planIDs,
                plansMap: PLANS_MAP,
                allowDowncycling: true,
                currency: DEFAULT_CURRENCY,
                rules: rulesWith24m,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        });

        it('should return 1, 12 and 24 cycles when user has a 12-month subscription and downcyling is allowed: with default rules', () => {
            const subscription = getSubscriptionMock();
            subscription.Cycle = CYCLE.YEARLY;
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                planIDs,
                plansMap: PLANS_MAP,
                allowDowncycling: true,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
        });

        it('should return 1, 12, 24 cycles if user has 24 cycle subscription and downcyling is allowed', () => {
            const subscription = getSubscriptionMock();
            subscription.Cycle = CYCLE.TWO_YEARS;
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                planIDs,
                plansMap: PLANS_MAP,
                allowDowncycling: true,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        });

        it('should return 1, 12 and 24 cycles if user has upcoming 12-cycle and downcyling is allowed: with 24m rules', () => {
            const subscription = getSubscriptionMock();
            subscription.Cycle = CYCLE.MONTHLY;
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const upcomingSubscriptionMock = getSubscriptionMock();
            upcomingSubscriptionMock.Cycle = CYCLE.YEARLY;
            subscription.UpcomingSubscription = upcomingSubscriptionMock;

            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                planIDs,
                plansMap: PLANS_MAP,
                allowDowncycling: true,
                currency: DEFAULT_CURRENCY,
                rules: rulesWith24m,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        });

        it('should return 1, 12 and 24 cycles if user has upcoming 12-cycle and downcyling is allowed: with default rules', () => {
            const subscription = getSubscriptionMock();
            subscription.Cycle = CYCLE.MONTHLY;
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                planIDs,
                plansMap: PLANS_MAP,
                allowDowncycling: true,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
        });

        it('should return 12, 24 cycles if minimumCycle is 12 and downcyling is allowed: with 24m rules', () => {
            const subscription = getSubscriptionMock();
            subscription.Cycle = CYCLE.MONTHLY;
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const minimumCycle = CYCLE.YEARLY;
            const maximumCycle = CYCLE.TWO_YEARS;

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                planIDs,
                plansMap: PLANS_MAP,
                allowDowncycling: true,
                currency: DEFAULT_CURRENCY,
                rules: rulesWith24m,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
        });

        it('should return 12, 24 cycles if minimumCycle is 12 and downcyling is allowed: with default rules', () => {
            const subscription = getSubscriptionMock();
            subscription.Cycle = CYCLE.MONTHLY;
            const planIDs: PlanIDs = {
                [PLANS.BUNDLE]: 1,
            };

            const minimumCycle = CYCLE.YEARLY;
            const maximumCycle = CYCLE.TWO_YEARS;

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                planIDs,
                plansMap: PLANS_MAP,
                allowDowncycling: true,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.YEARLY]);
        });

        const dimensions = {
            plans: [PLANS.DUO, PLANS.MAIL, PLANS.DRIVE],
            currencies: ['JPY', 'BRL'] as Currency[],
        };

        const allCombinations = dimensions.plans.reduce(
            (acc, plan) => {
                return acc.concat(dimensions.currencies.map((currency) => ({ plan, currency })));
            },
            [] as { plan: PLANS; currency: Currency }[]
        );

        it.each(allCombinations)(
            'should return 1 year cap for plans with regional currencies - $plan $currency',
            ({ plan, currency }) => {
                const subscription = undefined;
                const minimumCycle = CYCLE.MONTHLY;
                const maximumCycle = CYCLE.TWO_YEARS;
                const planIDs: PlanIDs = {
                    [plan]: 1,
                };

                const result = getAllowedCycles({
                    subscription,
                    minimumCycle,
                    maximumCycle,
                    planIDs,
                    plansMap: PLANS_MAP,
                    currency,
                });

                expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
            }
        );
    });
});
