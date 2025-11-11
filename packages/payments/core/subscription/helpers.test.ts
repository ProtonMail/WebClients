import { buildSubscription, buildUser } from '@proton/testing/builders';

import { ADDON_NAMES, COUPON_CODES, CYCLE, FREE_SUBSCRIPTION, PLANS, PLAN_NAMES } from '../constants';
import type { PlanIDs } from '../interface';
import { SubscriptionPlatform } from './constants';
import { FREE_PLAN } from './freePlans';
import {
    canModify,
    getAvailableSubscriptionActions,
    getPlanIDs,
    getSubscriptionPlanTitle,
    hasLumoMobileSubscription,
    isManagedExternally,
    isSubscriptionCheckForbidden,
    isSubscriptionUnchanged,
} from './helpers';

describe('getSubscriptionPlanTitle', () => {
    it('should return plan title and name for a paid user with subscription', () => {
        const subscription = buildSubscription({
            planName: PLANS.MAIL,
            cycle: CYCLE.MONTHLY,
            currency: 'USD',
        });

        const result = getSubscriptionPlanTitle(
            buildUser({
                isPaid: true,
                isFree: false,
                hasPassLifetime: false,
            }),
            subscription
        );

        expect(result).toEqual({
            planTitle: PLAN_NAMES[PLANS.MAIL],
            planName: PLANS.MAIL,
        });
    });

    it('should return Pass Lifetime plan for user with lifetime pass', () => {
        const userWithLifetimePass = buildUser({
            hasPassLifetime: true,
            isPaid: false,
        });

        const result = getSubscriptionPlanTitle(userWithLifetimePass, FREE_SUBSCRIPTION);

        expect(result).toEqual({
            planTitle: PLAN_NAMES[PLANS.PASS_LIFETIME],
            planName: PLANS.PASS_LIFETIME,
        });
    });

    it('should return free plan for free user', () => {
        const freeUser = buildUser({
            isPaid: false,
            isFree: true,
        });

        const result = getSubscriptionPlanTitle(freeUser, FREE_SUBSCRIPTION);

        expect(result).toEqual({
            planTitle: FREE_PLAN.Title,
            planName: FREE_PLAN.Name,
        });
    });

    it('should return "Lifetime" title for subscription with lifetime coupon', () => {
        const subscription = buildSubscription(
            {
                planName: PLANS.MAIL,
                cycle: CYCLE.MONTHLY,
                currency: 'USD',
            },
            {
                CouponCode: COUPON_CODES.LIFETIME,
            }
        );

        const result = getSubscriptionPlanTitle(
            buildUser({
                isPaid: true,
                isFree: false,
                hasPassLifetime: false,
            }),
            subscription
        );

        expect(result).toEqual({
            planTitle: 'Lifetime',
            planName: PLANS.MAIL,
        });
    });

    it('should handle undefined subscription for paid user', () => {
        const result = getSubscriptionPlanTitle(
            buildUser({
                isPaid: true,
                isFree: false,
                hasPassLifetime: false,
            }),
            undefined
        );

        expect(result).toEqual({
            planTitle: FREE_PLAN.Title,
            planName: FREE_PLAN.Name,
        });
    });
});

describe('isSubscriptionUnchanged', () => {
    it('returns true when subscription and planIds are deeply equal', () => {
        const subscription = buildSubscription();
        const planIds: PlanIDs = getPlanIDs(subscription); // Assuming getPlanIDs is a function that extracts plan IDs from a subscription

        const result = isSubscriptionUnchanged(subscription, planIds);
        expect(result).toBe(true);
    });

    it('returns false when subscription and planIds are not deeply equal', () => {
        const subscription = buildSubscription();
        const planIds: PlanIDs = {
            mail2022: 1,
        };

        const result = isSubscriptionUnchanged(subscription, planIds);
        expect(result).toBe(false);
    });

    it('returns true when both subscription and planIds are empty', () => {
        const result = isSubscriptionUnchanged(null, {});
        expect(result).toBe(true);
    });

    it('returns false when subscription is null and planIds is not null', () => {
        const planIds: PlanIDs = {
            bundle2022: 1,
        };

        const result = isSubscriptionUnchanged(null, planIds);
        expect(result).toBe(false);
    });

    it('returns false when subscription is not null and planIds is null', () => {
        const subscription = buildSubscription();

        const result = isSubscriptionUnchanged(subscription, null as any);
        expect(result).toBe(false);
    });

    it('should return true when cycle is the same as in the subscription', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;

        const planIds: PlanIDs = getPlanIDs(subscription);

        const result = isSubscriptionUnchanged(subscription, planIds, CYCLE.MONTHLY);
        expect(result).toBe(true);
    });

    it('should return false when cycle is different from the subscription', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;

        const planIds: PlanIDs = getPlanIDs(subscription);

        const result = isSubscriptionUnchanged(subscription, planIds, CYCLE.YEARLY);
        expect(result).toBe(false);
    });

    it('should return false if there is no upcoming subscription', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;

        const planIds: PlanIDs = getPlanIDs(subscription);

        const currentSubscriptionUnchanged = isSubscriptionUnchanged(subscription, planIds, CYCLE.MONTHLY);
        expect(currentSubscriptionUnchanged).toBe(true);

        const upcomingSubscriptionUnchangedYearly = isSubscriptionUnchanged(subscription, planIds, CYCLE.YEARLY);
        expect(upcomingSubscriptionUnchangedYearly).toBe(false);

        const upcomingSubscriptionUnchangedTwoYears = isSubscriptionUnchanged(subscription, planIds, CYCLE.TWO_YEARS);
        expect(upcomingSubscriptionUnchangedTwoYears).toBe(false);
    });
});

describe('isSubscriptionCheckForbidden', () => {
    it('returns false when subscription is null or undefined', () => {
        expect(isSubscriptionCheckForbidden(null, {}, CYCLE.MONTHLY)).toBe(false);
        expect(isSubscriptionCheckForbidden(undefined, {}, CYCLE.MONTHLY)).toBe(false);
    });

    it('returns true when selected plan is same as current with no upcoming subscription', () => {
        const subscription = buildSubscription();
        const planIds = getPlanIDs(subscription);

        // No upcoming subscription scenario
        expect(isSubscriptionCheckForbidden(subscription, planIds, subscription.Cycle)).toBe(true);
    });

    it('returns false for free subscription', () => {
        const freeSubscription = FREE_SUBSCRIPTION;
        const planIds = {};

        expect(isSubscriptionCheckForbidden(freeSubscription, planIds, CYCLE.MONTHLY)).toBe(false);
    });

    it('handles variable cycle offer correctly (automatic unpaid scheduled subscription)', () => {
        const UpcomingSubscription = buildSubscription(
            {
                planName: PLANS.BUNDLE,
                cycle: CYCLE.YEARLY,
                currency: 'USD',
            },
            {
                InvoiceID: '',
            }
        );

        const subscription = buildSubscription(
            {
                planName: PLANS.BUNDLE,
                cycle: CYCLE.TWO_YEARS,
                currency: 'USD',
            },
            {
                UpcomingSubscription,
            }
        );

        const currentPlanIds = getPlanIDs(subscription);
        const upcomingPlanIds = getPlanIDs(UpcomingSubscription);

        expect(isSubscriptionCheckForbidden(subscription, currentPlanIds, CYCLE.TWO_YEARS)).toBe(true);
        expect(isSubscriptionCheckForbidden(subscription, upcomingPlanIds, CYCLE.YEARLY)).toBe(true);
    });

    it('handles scheduled unpaid modification correctly (addon downgrade/downcycling)', () => {
        const Cycle = CYCLE.MONTHLY;

        const UpcomingSubscription = buildSubscription(
            {
                planIDs: {
                    [PLANS.MAIL_PRO]: 1,
                    [ADDON_NAMES.MEMBER_MAIL_PRO]: 2,
                    [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 2,
                },
                cycle: Cycle,
                currency: 'USD',
            },
            {
                InvoiceID: '',
            }
        );

        const subscription = buildSubscription(
            {
                planIDs: {
                    [PLANS.MAIL_PRO]: 1,
                    [ADDON_NAMES.MEMBER_MAIL_PRO]: 2,
                    [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 3,
                },
                cycle: Cycle,
                currency: 'USD',
            },
            {
                UpcomingSubscription,
            }
        );

        const currentPlanIds = getPlanIDs(subscription);
        const upcomingPlanIds = getPlanIDs(UpcomingSubscription);

        expect(isSubscriptionCheckForbidden(subscription, currentPlanIds, Cycle)).toBe(false);

        expect(isSubscriptionCheckForbidden(subscription, upcomingPlanIds, Cycle)).toBe(true);
    });

    it('handles prepaid upcoming subscription correctly', () => {
        const UpcomingSubscription = buildSubscription({
            planName: PLANS.BUNDLE,
            cycle: CYCLE.YEARLY,
            currency: 'USD',
        });
        const subscription = buildSubscription(
            {
                planName: PLANS.BUNDLE,
                cycle: CYCLE.MONTHLY,
                currency: 'USD',
            },
            {
                UpcomingSubscription,
            }
        );

        const currentPlanIds = getPlanIDs(subscription);
        const upcomingPlanIds = getPlanIDs(UpcomingSubscription);

        expect(isSubscriptionCheckForbidden(subscription, currentPlanIds, CYCLE.MONTHLY)).toBe(true);
        expect(isSubscriptionCheckForbidden(subscription, upcomingPlanIds, CYCLE.YEARLY)).toBe(true);
    });

    it('returns false when selected plan is different from both current and upcoming', () => {
        const UpcomingSubscription = buildSubscription({
            planName: PLANS.BUNDLE,
            cycle: CYCLE.YEARLY,
            currency: 'USD',
        });
        const subscription = buildSubscription(
            {
                planName: PLANS.BUNDLE,
                cycle: CYCLE.MONTHLY,
                currency: 'USD',
            },
            {
                UpcomingSubscription,
            }
        );

        const differentPlanIds = { [PLANS.DRIVE]: 1 };

        expect(isSubscriptionCheckForbidden(subscription, differentPlanIds, CYCLE.MONTHLY)).toBe(false);
        expect(isSubscriptionCheckForbidden(subscription, differentPlanIds, CYCLE.YEARLY)).toBe(false);
    });

    it('should return true when user has externally managed Lumo subscription and selects the same plan', () => {
        const subscribtion = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.iOS,
        });

        expect(isSubscriptionCheckForbidden(subscribtion, { [PLANS.LUMO]: 1 }, CYCLE.MONTHLY)).toBe(true);
        expect(isSubscriptionCheckForbidden(subscribtion, { [PLANS.LUMO]: 1 }, CYCLE.YEARLY)).toBe(true);
        expect(isSubscriptionCheckForbidden(subscribtion, { [PLANS.LUMO]: 1 }, CYCLE.TWO_YEARS)).toBe(true);
    });

    it('should return false when user has externally managed Lumo subscription and selects a different plan', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.iOS,
        });

        expect(isSubscriptionCheckForbidden(subscription, { [PLANS.MAIL]: 1 }, CYCLE.MONTHLY)).toBe(false);
        expect(isSubscriptionCheckForbidden(subscription, { [PLANS.MAIL]: 1 }, CYCLE.YEARLY)).toBe(false);
        expect(isSubscriptionCheckForbidden(subscription, { [PLANS.MAIL]: 1 }, CYCLE.TWO_YEARS)).toBe(false);
    });

    it('should work with lumo the usual way if it is managed internally', () => {
        const subscribtion = buildSubscription(
            {
                planName: PLANS.LUMO,
                cycle: CYCLE.MONTHLY,
                currency: 'USD',
            },
            {
                External: SubscriptionPlatform.Default,
            }
        );

        expect(isSubscriptionCheckForbidden(subscribtion, { [PLANS.LUMO]: 1 }, CYCLE.MONTHLY)).toBe(true);
        expect(isSubscriptionCheckForbidden(subscribtion, { [PLANS.LUMO]: 1 }, CYCLE.YEARLY)).toBe(false);
        expect(isSubscriptionCheckForbidden(subscribtion, { [PLANS.LUMO]: 1 }, CYCLE.TWO_YEARS)).toBe(false);
    });

    it.each([
        {
            case: 'User has only Lumo mobile subscription',
            subscription: buildSubscription(
                {
                    planName: PLANS.LUMO,
                    cycle: CYCLE.MONTHLY,
                    currency: 'USD',
                },
                {
                    External: SubscriptionPlatform.Android,
                }
            ),
        },
        {
            case: 'User has Lumo mobile subscription and a web bundle subscription',
            subscription: buildSubscription(
                {
                    planName: PLANS.BUNDLE,
                    cycle: CYCLE.MONTHLY,
                    currency: 'USD',
                },
                {
                    External: SubscriptionPlatform.Default,
                    SecondarySubscriptions: [
                        buildSubscription(PLANS.LUMO, {
                            External: SubscriptionPlatform.Android,
                        }),
                    ],
                }
            ),
        },
    ])(
        'should return true if user has Lumo mobile subscription adn tries to subscribe to a multi-user personal plan',
        ({ subscription }) => {
            expect(isSubscriptionCheckForbidden(subscription, { [PLANS.DUO]: 1 }, CYCLE.MONTHLY)).toBe(true);
            expect(isSubscriptionCheckForbidden(subscription, { [PLANS.FAMILY]: 1 }, CYCLE.MONTHLY)).toBe(true);
            expect(isSubscriptionCheckForbidden(subscription, { [PLANS.VISIONARY]: 1 }, CYCLE.MONTHLY)).toBe(true);
            expect(isSubscriptionCheckForbidden(subscription, { [PLANS.PASS_FAMILY]: 1 }, CYCLE.MONTHLY)).toBe(true);
        }
    );
});

describe('isManagedExternally', () => {
    it('returns false when subscription is null', () => {
        expect(isManagedExternally(null)).toBe(false);
    });

    it('returns false when subscription is undefined', () => {
        expect(isManagedExternally(undefined)).toBe(false);
    });

    it('returns false for free subscription', () => {
        const freeSubscription = FREE_SUBSCRIPTION;
        expect(isManagedExternally(freeSubscription)).toBe(false);
    });

    it('returns true when subscription is managed by Android', () => {
        const subscription = buildSubscription(undefined, {
            External: SubscriptionPlatform.Android,
        });
        expect(isManagedExternally(subscription)).toBe(true);
    });

    it('returns true when subscription is managed by iOS', () => {
        const subscription = buildSubscription(undefined, {
            External: SubscriptionPlatform.iOS,
        });
        expect(isManagedExternally(subscription)).toBe(true);
    });

    it('returns false when subscription is not externally managed', () => {
        const subscription = buildSubscription(undefined, {
            External: SubscriptionPlatform.Default,
        });
        expect(isManagedExternally(subscription)).toBe(false);
    });
});

describe('canModify', () => {
    it('returns true when subscription is null', () => {
        expect(canModify(null as any)).toBe(true);
    });

    it('returns true when subscription is undefined', () => {
        expect(canModify(undefined as any)).toBe(true);
    });

    it('returns true for free subscription', () => {
        expect(canModify(FREE_SUBSCRIPTION as any)).toBe(true);
    });

    it('returns false for externally managed subscription without Lumo', () => {
        const subscription = buildSubscription(undefined, {
            External: SubscriptionPlatform.Android,
        });
        expect(canModify(subscription)).toBe(false);
    });

    it('returns true for non-externally managed subscription', () => {
        const subscription = buildSubscription(undefined, {
            External: SubscriptionPlatform.Default,
        });
        expect(canModify(subscription)).toBe(true);
    });

    it('returns true for externally managed subscription with Lumo', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.Android,
        });

        expect(canModify(subscription)).toBe(true);
    });
});

describe('getAvailableActions', () => {
    it('returns all actions available for non-externally managed subscription', () => {
        const subscription = buildSubscription(undefined, {
            External: SubscriptionPlatform.Default,
        });

        const result = getAvailableSubscriptionActions(subscription);

        expect(result).toEqual({
            canModify: true,
            cantModifyReason: undefined,
            canCancel: true,
            cantCancelReason: undefined,
        });
    });

    it('returns no actions available for externally managed subscription without Lumo', () => {
        const subscription = buildSubscription(undefined, {
            External: SubscriptionPlatform.Android,
        });

        const result = getAvailableSubscriptionActions(subscription);

        expect(result).toEqual({
            canModify: false,
            cantModifyReason: 'subscription_managed_externally',
            canCancel: false,
            cantCancelReason: 'subscription_managed_externally',
        });
    });

    it('returns only modify action available for externally managed subscription with Lumo', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.Android,
        });

        const result = getAvailableSubscriptionActions(subscription);

        expect(result).toEqual({
            canModify: true,
            cantModifyReason: undefined,
            canCancel: false,
            cantCancelReason: 'subscription_managed_externally',
        });
    });
});

describe('hasLumoMobileSubscription', () => {
    it('should return false for free subscription', () => {
        expect(hasLumoMobileSubscription(FREE_SUBSCRIPTION)).toBe(false);
    });

    it('should return false if subscription is undefined or null', () => {
        expect(hasLumoMobileSubscription(undefined)).toBe(false);
        expect(hasLumoMobileSubscription(null as any)).toBe(false);
    });

    it('should return false if subscription is not externally managed', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.Default,
        });
        expect(hasLumoMobileSubscription(subscription)).toBe(false);
    });

    it('should return true if subscription is externally managed and has Lumo', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.Android,
        });
        expect(hasLumoMobileSubscription(subscription)).toBe(true);
    });

    it('should return false if user does not have secondary subscriptions', () => {
        const subscription = buildSubscription(PLANS.BUNDLE, {});
        expect(hasLumoMobileSubscription(subscription)).toBe(false);
    });

    it('should return true if user has secondary subscriptions and at least one of them is externally managed and has Lumo', () => {
        const subscription = buildSubscription(PLANS.BUNDLE, {
            SecondarySubscriptions: [
                buildSubscription(PLANS.VPN2024, { External: SubscriptionPlatform.Default }),
                buildSubscription(PLANS.LUMO, { External: SubscriptionPlatform.Android }),
            ],
        });
        expect(hasLumoMobileSubscription(subscription)).toBe(true);
    });
});
