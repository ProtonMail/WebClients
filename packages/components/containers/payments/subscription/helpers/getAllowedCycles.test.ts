import {
    ADDON_NAMES,
    CYCLE,
    type Currency,
    DEFAULT_CURRENCY,
    FREE_SUBSCRIPTION,
    PLANS,
    type Plan,
    type PlanIDs,
    getPlansMap,
    isRegionalCurrency,
} from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { buildSubscription } from '@proton/testing/builders';
import { PLANS_MAP, getLongTestPlans, getTestPlansMap } from '@proton/testing/data';

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

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return 1, 12 and 24 cycles when user has a 1-month subscription: with 24m rules', () => {
        const subscription = buildSubscription();
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

    it('should return 1, 12, 24 cycles when user has a 1-month subscription: with default rules', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
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

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return 12 and 24 cycles when user has a 12-month subscription: with 24m rules', () => {
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
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

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return only 24 cycle if user has 24 cycle subscription', () => {
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const upcomingSubscriptionMock = buildSubscription();
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
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const upcomingSubscriptionMock = buildSubscription();
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

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return all cycles if user has referral subscription: with 24m rules', () => {
        const subscription = buildSubscription();
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

    it('should return all cycles if user has referral subscription: with default rules', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
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

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return all cycles if user was downgraded: with 24m rules', () => {
        const subscription = buildSubscription();
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

    it('should return all cycles if user was downgraded: with default rules', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
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

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return all cycles if user has trial subscription: with 24m rules', () => {
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
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

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return cycles respecting minimumCycle = 12 if user has trial subscription: with 24m rules', () => {
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.IsTrial = true;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
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

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return cycles respecting minimumCycle = 24 if user has trial subscription: with 24m rules', () => {
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
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

    it('should return 1m, 12m, 24m if plan is changed from bundle 24m to mail: with 24m rules', () => {
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
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

    it('should return cycles respecting the cycleParam if plan is changed', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.TWO_YEARS;
        const planIDs: PlanIDs = {
            [PLANS.MAIL]: 1,
        };

        const cycleParam = CYCLE.TWO_YEARS;

        const result = getAllowedCycles({
            subscription,
            cycleParam,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
        });
        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should return cycles respecting the maximumCycle = 12', () => {
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.YEARLY;
        const upcomingSubscription = buildSubscription();
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
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.YEARLY;
        const upcomingSubscription = buildSubscription();
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
                [PLANS.DRIVE_1TB]: 1,
            } as any,
            // this test assumes that drive1tb2025 does not have 24 cycle in PLANS_MAP
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

    it.each(
        // Generate all combinations of sourceCycles and targetPlans
        [CYCLE.MONTHLY, CYCLE.THREE, CYCLE.YEARLY, CYCLE.FIFTEEN, CYCLE.TWO_YEARS, CYCLE.THIRTY].flatMap((fromCycle) =>
            [PLANS.VPN2024, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY].map((targetPlan) => ({
                fromCycle,
                targetPlan,
            }))
        )
        // In case if you need to debug a test, you can uncomment the following filter
        // .filter(({ fromCycle, targetPlan }) => {
        //     return fromCycle === CYCLE.YEARLY && targetPlan === PLANS.VISIONARY;
        // })
    )(
        'should return all cycles when user is on vpn2022 with $fromCycle cycle and selects $targetPlan',
        ({ fromCycle, targetPlan }) => {
            const subscription = buildSubscription();
            subscription.Cycle = fromCycle;
            subscription.Plans[0].Name = PLANS.VPN; // vpn2022 by design of this unit test

            const planIDs: PlanIDs = {
                [targetPlan]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            const expectedCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];
            expect(result).toEqual(expectedCycles);
        }
    );

    it.each(
        // Generate all combinations of sourceCycles and targetPlans
        [CYCLE.MONTHLY, CYCLE.THREE, CYCLE.SIX, CYCLE.YEARLY, CYCLE.FIFTEEN, CYCLE.TWO_YEARS, CYCLE.THIRTY].flatMap(
            (fromCycle) =>
                [PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY].map((targetPlan) => ({
                    fromCycle,
                    targetPlan,
                }))
        )
        // In case if you need to debug a test, you can uncomment the following filter
        // .filter(({ fromCycle, targetPlan }) => {
        //     return fromCycle === CYCLE.YEARLY && targetPlan === PLANS.VISIONARY;
        // })
    )(
        'should return all cycles when user is on vpn2024 with $fromCycle cycle and selects $targetPlan',
        ({ fromCycle, targetPlan }) => {
            const subscription = buildSubscription();
            subscription.Cycle = fromCycle;
            subscription.Plans[0].Name = PLANS.VPN2024;

            const planIDs: PlanIDs = {
                [targetPlan]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            const expectedCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];
            expect(result).toEqual(expectedCycles);
        }
    );

    it.each(
        [PLANS.BUNDLE, PLANS.FAMILY, PLANS.DUO, PLANS.VISIONARY].flatMap((sourcePlan) =>
            [PLANS.BUNDLE, PLANS.FAMILY, PLANS.DUO, PLANS.VISIONARY]
                .map((targetPlan) => ({
                    sourcePlan,
                    targetPlan,
                }))
                // If user selects the same plan then it's a different case, so we exclude it from this test
                .filter(({ sourcePlan, targetPlan }) => sourcePlan !== targetPlan)
        )
    )(
        'should show all cycles when user is on $sourcePlan with 24m cycle and selects $targetPlan',
        ({ sourcePlan, targetPlan }) => {
            const subscription = buildSubscription();
            subscription.Cycle = CYCLE.TWO_YEARS;
            subscription.Plans[0].Name = sourcePlan;

            const planIDs: PlanIDs = {
                [targetPlan]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    it.each(
        [CYCLE.MONTHLY, CYCLE.YEARLY].flatMap((fromCycle) =>
            [PLANS.MAIL, PLANS.DRIVE, PLANS.PASS, PLANS.LUMO].map((sourcePlan) => ({
                fromCycle,
                sourcePlan,
            }))
        )
    )(
        'should show all cycles when user is on $sourcePlan with $fromCycle cycle and selects VPN',
        ({ fromCycle, sourcePlan }) => {
            const subscription = buildSubscription();
            subscription.Cycle = fromCycle;
            subscription.Plans[0].Name = sourcePlan;

            const planIDs: PlanIDs = {
                [PLANS.VPN2024]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    // when user tries to switch between non-VPN plans and they have 1m or 12m cycle then they should see 1m, 12m
    const nonVpnPlusPlans = [PLANS.DRIVE, PLANS.PASS];
    it.each(
        nonVpnPlusPlans
            .flatMap((sourcePlan) =>
                nonVpnPlusPlans.flatMap((targetPlan) =>
                    [CYCLE.MONTHLY, CYCLE.YEARLY].map((cycle) => ({
                        sourcePlan,
                        targetPlan,
                        cycle,
                    }))
                )
            )
            .filter(({ sourcePlan, targetPlan }) => sourcePlan !== targetPlan)
    )(
        'should show 1m, 12m cycles when user is on $sourcePlan with $cycle cycle and selects $targetPlan',
        ({ sourcePlan, targetPlan, cycle }) => {
            const subscription = buildSubscription();
            subscription.Cycle = cycle;
            subscription.Plans[0].Name = sourcePlan;

            const planIDs: PlanIDs = {
                [targetPlan]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    const b2cBundlePlans = [PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY];

    // when user with 1m OR 12m cycle tries to switch from non-VPN plus plan to one of bundle plans then they should see 1m, 12m
    it.each(
        nonVpnPlusPlans.flatMap((sourcePlan) =>
            b2cBundlePlans.flatMap((targetPlan) =>
                [CYCLE.MONTHLY, CYCLE.YEARLY].map((cycle) => ({
                    sourcePlan,
                    targetPlan,
                    cycle,
                }))
            )
        )
    )(
        'should show 1m, 12m, 24m cycles when user is on $sourcePlan with $cycle cycle and selects $targetPlan',
        ({ sourcePlan, targetPlan, cycle }) => {
            const subscription = buildSubscription();
            subscription.Cycle = cycle;
            subscription.Plans[0].Name = sourcePlan;

            const planIDs: PlanIDs = {
                [targetPlan]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    // when user on 24m non-VPN plus plan tries to switch to VPN then they should see 1m, 12m, 24m
    it.each([PLANS.MAIL, PLANS.DRIVE, PLANS.PASS])(
        'should show 1m, 12m, 24m cycles when user is on $sourcePlan with 24m cycle and selects VPN',
        (sourcePlan) => {
            const subscription = buildSubscription();
            subscription.Cycle = CYCLE.TWO_YEARS;
            subscription.Plans[0].Name = sourcePlan;

            const planIDs: PlanIDs = {
                [PLANS.VPN2024]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    // when user on 24m non-VPN plus plan tries to switch to B2C bundle plans then they should see 1m, 12m, 24m
    it.each(
        [PLANS.MAIL, PLANS.DRIVE, PLANS.PASS].flatMap((sourcePlan) =>
            b2cBundlePlans.map((targetPlan) => ({
                sourcePlan,
                targetPlan,
            }))
        )
    )(
        'should show 1m, 12m, 24m cycles when user is on $sourcePlan with 24m cycle and selects $targetPlan',
        ({ sourcePlan, targetPlan }) => {
            const subscription = buildSubscription();
            subscription.Cycle = CYCLE.TWO_YEARS;
            subscription.Plans[0].Name = sourcePlan;

            const planIDs: PlanIDs = {
                [targetPlan]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    // when user on 24m plan tries to switch to non-VPN plus plan then they should see 1m, 12m

    const b2cPlusPlans = [PLANS.VPN2024, PLANS.MAIL, PLANS.DRIVE, PLANS.PASS];

    it.each(
        b2cPlusPlans
            .flatMap((sourcePlan) => b2cPlusPlans.map((targetPlan) => ({ sourcePlan, targetPlan })))
            .filter(({ targetPlan }) => targetPlan !== PLANS.VPN2024 && targetPlan !== PLANS.MAIL)
            .filter(({ sourcePlan, targetPlan }) => sourcePlan !== targetPlan)
    )(
        'should show 1m, 12m cycles when user is on $sourcePlan with 24m cycle and selects $targetPlan',
        ({ sourcePlan, targetPlan }) => {
            const subscription = buildSubscription();
            subscription.Cycle = CYCLE.TWO_YEARS;
            subscription.Plans[0].Name = sourcePlan;

            const planIDs: PlanIDs = {
                [targetPlan]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    it('should show 24m option when user has a scheduled 24m subscription and selects the same plan', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.YEARLY;
        subscription.Plans[0].Name = PLANS.BUNDLE;

        const upcomingSubscription = buildSubscription();
        upcomingSubscription.Cycle = CYCLE.TWO_YEARS;
        upcomingSubscription.Plans[0].Name = PLANS.BUNDLE;

        subscription.UpcomingSubscription = upcomingSubscription;

        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        expect(
            getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
                allowDowncycling: true,
            })
        ).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);

        expect(
            getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
                allowDowncycling: false,
            })
        ).toEqual([CYCLE.TWO_YEARS]);
    });

    // when user has any b2c plan with scheduled 24m subscription and selects VPN plan then they should see 1m, 12m, 24m
    it.each([...b2cPlusPlans, ...b2cBundlePlans])(
        'should show 1m, 12m, 24m cycles when user is on $sourcePlan with 24m cycle and selects VPN',
        (sourcePlan) => {
            const subscription = buildSubscription();
            subscription.Cycle = CYCLE.YEARLY;
            subscription.Plans[0].Name = sourcePlan;

            const upcomingSubscription = buildSubscription();
            upcomingSubscription.Cycle = CYCLE.TWO_YEARS;
            upcomingSubscription.Plans[0].Name = sourcePlan;

            subscription.UpcomingSubscription = upcomingSubscription;

            const planIDs: PlanIDs = {
                [PLANS.VPN2024]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
                allowDowncycling: true,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    // when user has any B2C plan with 24m scheduled subscription and selects any other B2C Plus (except VPN) plan then they should see 1m, 12m
    it.each(
        [...b2cPlusPlans, ...b2cBundlePlans].flatMap((sourcePlan) =>
            b2cPlusPlans
                .filter((targetPlan) => targetPlan !== PLANS.VPN2024 && targetPlan !== PLANS.MAIL)
                .map((targetPlan) => ({
                    sourcePlan,
                    targetPlan,
                }))
                .filter(({ sourcePlan, targetPlan }) => sourcePlan !== targetPlan)
        )
    )(
        'should show 1m, 12m cycles when user is on $sourcePlan with 24m cycle and selects $targetPlan',
        ({ sourcePlan, targetPlan }) => {
            const subscription = buildSubscription();
            subscription.Cycle = CYCLE.YEARLY;
            subscription.Plans[0].Name = sourcePlan;

            const upcomingSubscription = buildSubscription();
            upcomingSubscription.Cycle = CYCLE.TWO_YEARS;
            upcomingSubscription.Plans[0].Name = sourcePlan;

            subscription.UpcomingSubscription = upcomingSubscription;

            const planIDs: PlanIDs = {
                [targetPlan]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    // when user has any B2C plan with 24m scheduled subscription and selects a bundle b2c plan then they should see 1m, 12m, 24m
    it.each(
        [...b2cPlusPlans, ...b2cBundlePlans].flatMap((sourcePlan) =>
            b2cBundlePlans
                .map((targetPlan) => ({
                    sourcePlan,
                    targetPlan,
                }))
                .filter(({ sourcePlan, targetPlan }) => sourcePlan !== targetPlan)
                .filter(({ sourcePlan, targetPlan }) => sourcePlan === PLANS.MAIL && targetPlan === PLANS.BUNDLE)
        )
    )(
        'should show 1m, 12m, 24m cycles when user is on $sourcePlan with 24m scheduled cycle and selects $targetPlan',
        ({ sourcePlan, targetPlan }) => {
            const subscription = buildSubscription();
            subscription.Cycle = CYCLE.YEARLY;
            subscription.Plans[0].Name = sourcePlan;

            const upcomingSubscription = buildSubscription();
            upcomingSubscription.Cycle = CYCLE.TWO_YEARS;
            upcomingSubscription.Plans[0].Name = sourcePlan;

            subscription.UpcomingSubscription = upcomingSubscription;

            const planIDs: PlanIDs = {
                [targetPlan]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    // when free user opens VPN dashboard then they should see 1m, 12m, 24m for VPN2024 and B2C bundle plans.
    it.each([PLANS.VPN2024, ...b2cBundlePlans])(
        'should show correct cycles for free users: user selects %s',
        (plan) => {
            const vpnApp = APPS.PROTONVPN_SETTINGS;

            const planIDs: PlanIDs = {
                [plan]: 1,
            };

            const result = getAllowedCycles({
                subscription: undefined,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
                app: vpnApp,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    // when free user opens any (non-VPN) app then they should see 1m, 12m, 24m for bundle b2c plans
    it.each([...b2cBundlePlans])('should show correct cycles for free users: user selects %s', (plan) => {
        const planIDs: PlanIDs = {
            [plan]: 1,
        };

        expect(
            getAllowedCycles({
                subscription: undefined,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
                app: undefined,
            })
        ).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    // They should see 1m and 12m for other B2C plus plans
    it.each([...b2cPlusPlans.filter((plan) => plan !== PLANS.VPN2024 && plan !== PLANS.MAIL)])(
        'should show correct cycles for free users: user selects %s',
        (plan) => {
            const vpnApp = APPS.PROTONVPN_SETTINGS;

            const planIDs: PlanIDs = {
                [plan]: 1,
            };

            expect(
                getAllowedCycles({
                    subscription: undefined,
                    planIDs,
                    plansMap: PLANS_MAP,
                    currency: DEFAULT_CURRENCY,
                    app: vpnApp,
                })
            ).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);

            expect(
                getAllowedCycles({
                    subscription: undefined,
                    planIDs,
                    plansMap: PLANS_MAP,
                    currency: DEFAULT_CURRENCY,
                    app: undefined,
                })
            ).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    // when user has 1m or 12m bundle plan and selects any other bundle plan then they should see 1m, 12m, 24m
    it.each(
        b2cBundlePlans
            .flatMap((targetPlan) =>
                b2cBundlePlans.flatMap((sourcePlan) =>
                    [CYCLE.MONTHLY, CYCLE.YEARLY].map((sourceCycle) => ({ sourcePlan, sourceCycle, targetPlan }))
                )
            )
            .filter(({ sourcePlan, targetPlan }) => sourcePlan !== targetPlan)
    )(
        'should show 1m, 12m, 24m cycles when user is on $sourcePlan with $sourceCycle cycle and selects $targetPlan',
        ({ sourcePlan, sourceCycle, targetPlan }) => {
            const subscription = buildSubscription();
            subscription.Cycle = sourceCycle;
            subscription.Plans[0].Name = sourcePlan;

            const planIDs: PlanIDs = {
                [targetPlan]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
        }
    );

    // when user has 1m or 12m bundle plan and selects the same plan then they should see 24m option
    it.each(
        b2cBundlePlans.flatMap((plan) => [CYCLE.MONTHLY, CYCLE.YEARLY].map((sourceCycle) => ({ plan, sourceCycle })))
    )(
        'should show 24m option when user is on $plan with $sourceCycle cycle and selects the same plan',
        ({ plan, sourceCycle }) => {
            const subscription = buildSubscription();
            subscription.Cycle = sourceCycle;
            subscription.Plans[0].Name = plan;

            const planIDs: PlanIDs = {
                [plan]: 1,
            };

            const result = getAllowedCycles({
                subscription,
                planIDs,
                plansMap: PLANS_MAP,
                currency: DEFAULT_CURRENCY,
            });

            const expected = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY].filter((cycle) => cycle >= sourceCycle);
            expect(result).toEqual(expected);
        }
    );

    it.each([
        {
            targetPlan: PLANS.MAIL,
        },
        {
            targetPlan: PLANS.VPN2024,
        },
        {
            targetPlan: PLANS.BUNDLE,
        },
        {
            targetPlan: PLANS.DUO,
        },
        {
            targetPlan: PLANS.FAMILY,
        },
        {
            targetPlan: PLANS.VISIONARY,
        },
    ])('should show 24m offers to free users who select $targetPlan', ({ targetPlan }) => {
        const planIDs: PlanIDs = {
            [targetPlan]: 1,
        };

        const result = getAllowedCycles({
            subscription: FREE_SUBSCRIPTION,
            planIDs,
            plansMap: PLANS_MAP,
            currency: DEFAULT_CURRENCY,
            app: undefined,
        });

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });
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

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
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

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY]);
    });

    it('should sort defaultCycles to THIRTY, FIFTEEN, MONTHLY: with 24m rules', () => {
        const subscription = undefined;
        const minimumCycle = CYCLE.MONTHLY;
        const maximumCycle = CYCLE.THIRTY;
        const defaultCycles = [CYCLE.THIRTY, CYCLE.MONTHLY, CYCLE.FIFTEEN];
        const planIDs: PlanIDs = {
            [PLANS.VPN2024]: 1,
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
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.YEARLY;
        const planIDs: PlanIDs = {
            [PLANS.PASS]: 1,
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
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const upcomingSubscriptionMock = buildSubscription();
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
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.PASS]: 1,
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
        const subscription = buildSubscription();
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
        const subscription = buildSubscription();
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

        expect(result).toEqual([CYCLE.TWO_YEARS, CYCLE.YEARLY]);
    });

    it('should return 12 cycle if minimumCycle is 12 and downcyling is allowed: with default rules', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;
        const planIDs: PlanIDs = {
            [PLANS.PASS]: 1,
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
        'should return 2 year cap for plans with regional currencies - $plan $currency',
        ({ plan, currency }) => {
            const subscription = undefined;
            const minimumCycle = CYCLE.MONTHLY;
            const maximumCycle = CYCLE.TWO_YEARS;
            const planIDs: PlanIDs = {
                [plan]: 1,
            };

            const customPlansMap = getPlansMap(getLongTestPlans(currency), currency, false);

            const result = getAllowedCycles({
                subscription,
                minimumCycle,
                maximumCycle,
                planIDs,
                plansMap: customPlansMap,
                currency,
            });

            const cycles =
                plan === PLANS.DRIVE ? [CYCLE.YEARLY, CYCLE.MONTHLY] : [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

            expect(result).toEqual(cycles);
        }
    );

    it('should not return 24m cycle if it does not exist on the backend', () => {
        const customPlansMap = getTestPlansMap();
        customPlansMap[PLANS.MAIL] = {
            ...(customPlansMap[PLANS.MAIL] as Plan),
            Pricing: {
                [CYCLE.MONTHLY]: customPlansMap[PLANS.MAIL]!.Pricing[CYCLE.MONTHLY],
                [CYCLE.YEARLY]: customPlansMap[PLANS.MAIL]!.Pricing[CYCLE.YEARLY],
            },
            DefaultPricing: {
                [CYCLE.MONTHLY]: customPlansMap[PLANS.MAIL]!.DefaultPricing?.[CYCLE.MONTHLY],
                [CYCLE.YEARLY]: customPlansMap[PLANS.MAIL]!.DefaultPricing?.[CYCLE.YEARLY],
            },
        };

        expect(Object.keys(customPlansMap[PLANS.MAIL]?.Pricing ?? {}).map((it) => +it)).toEqual([
            CYCLE.MONTHLY,
            CYCLE.YEARLY,
        ]);
        expect(Object.keys(customPlansMap[PLANS.MAIL]?.DefaultPricing ?? {}).map((it) => +it)).toEqual([
            CYCLE.MONTHLY,
            CYCLE.YEARLY,
        ]);

        const result = getAllowedCycles({
            subscription: FREE_SUBSCRIPTION,
            minimumCycle: CYCLE.MONTHLY,
            maximumCycle: CYCLE.TWO_YEARS,
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap: customPlansMap,
            currency: DEFAULT_CURRENCY,
        });

        expect(result).toEqual([CYCLE.YEARLY, CYCLE.MONTHLY]);
    });
});
