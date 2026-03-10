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
    isDangerouslyAllowedSubscriptionEstimation,
    isManagedExternally,
    isSubscriptionCheckForbidden,
    isSubscriptionCheckForbiddenWithReason,
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
    it('returns true when subscription and planIDs are deeply equal', () => {
        const subscription = buildSubscription();
        const planIDs: PlanIDs = getPlanIDs(subscription); // Assuming getPlanIDs is a function that extracts plan IDs from a subscription

        const result = isSubscriptionUnchanged(subscription, planIDs);
        expect(result).toBe(true);
    });

    it('returns false when subscription and planIDs are not deeply equal', () => {
        const subscription = buildSubscription();
        const planIDs: PlanIDs = {
            mail2022: 1,
        };

        const result = isSubscriptionUnchanged(subscription, planIDs);
        expect(result).toBe(false);
    });

    it('returns true when both subscription and planIDs are empty', () => {
        const result = isSubscriptionUnchanged(null, {});
        expect(result).toBe(true);
    });

    it('returns false when subscription is null and planIDs is not null', () => {
        const planIDs: PlanIDs = {
            bundle2022: 1,
        };

        const result = isSubscriptionUnchanged(null, planIDs);
        expect(result).toBe(false);
    });

    it('returns false when subscription is not null and planIDs is null', () => {
        const subscription = buildSubscription();

        const result = isSubscriptionUnchanged(subscription, null as any);
        expect(result).toBe(false);
    });

    it('should return true when cycle is the same as in the subscription', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;

        const planIDs: PlanIDs = getPlanIDs(subscription);

        const result = isSubscriptionUnchanged(subscription, planIDs, CYCLE.MONTHLY);
        expect(result).toBe(true);
    });

    it('should return false when cycle is different from the subscription', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;

        const planIDs: PlanIDs = getPlanIDs(subscription);

        const result = isSubscriptionUnchanged(subscription, planIDs, CYCLE.YEARLY);
        expect(result).toBe(false);
    });

    it('should return false if there is no upcoming subscription', () => {
        const subscription = buildSubscription();
        subscription.Cycle = CYCLE.MONTHLY;

        const planIDs: PlanIDs = getPlanIDs(subscription);

        const currentSubscriptionUnchanged = isSubscriptionUnchanged(subscription, planIDs, CYCLE.MONTHLY);
        expect(currentSubscriptionUnchanged).toBe(true);

        const upcomingSubscriptionUnchangedYearly = isSubscriptionUnchanged(subscription, planIDs, CYCLE.YEARLY);
        expect(upcomingSubscriptionUnchangedYearly).toBe(false);

        const upcomingSubscriptionUnchangedTwoYears = isSubscriptionUnchanged(subscription, planIDs, CYCLE.TWO_YEARS);
        expect(upcomingSubscriptionUnchangedTwoYears).toBe(false);
    });
});

describe('isSubscriptionCheckForbidden', () => {
    it('returns false when subscription is null or undefined', () => {
        expect(isSubscriptionCheckForbidden(null, { planIDs: {}, cycle: CYCLE.MONTHLY })).toBe(false);
        expect(isSubscriptionCheckForbidden(undefined, { planIDs: {}, cycle: CYCLE.MONTHLY })).toBe(false);
    });

    it('returns true when selected plan is same as current with no upcoming subscription', () => {
        const subscription = buildSubscription();
        const planIDs = getPlanIDs(subscription);

        // No upcoming subscription scenario
        expect(isSubscriptionCheckForbidden(subscription, { planIDs, cycle: subscription.Cycle })).toBe(true);
    });

    it('returns false when selected plan is same as current but there is a coupon', () => {
        const planIDs = { [PLANS.MAIL]: 1 };
        const cycle = CYCLE.MONTHLY;
        const currency = 'USD';

        expect(
            isSubscriptionCheckForbidden(
                buildSubscription({
                    planIDs,
                    cycle,
                    currency,
                }),
                {
                    planIDs,
                    cycle,
                    coupon: 'TEST_COUPON',
                }
            )
        ).toBe(false);
    });

    it('returns false when selected plan is same as current but there are Codes', () => {
        const planIDs = { [PLANS.MAIL]: 1 };
        const cycle = CYCLE.MONTHLY;
        const currency = 'USD';

        expect(
            isSubscriptionCheckForbidden(
                buildSubscription({
                    planIDs,
                    cycle,
                    currency,
                }),
                {
                    planIDs,
                    cycle,
                    Codes: ['TEST_COUPON'],
                }
            )
        ).toBe(false);
    });

    it('returns true when selected plan matches upcoming subscription even with a coupon', () => {
        const planIDs = { [PLANS.BUNDLE]: 1 };

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

        expect(
            isSubscriptionCheckForbidden(subscription, {
                planIDs,
                cycle: CYCLE.YEARLY,
                coupon: 'TEST_COUPON',
            })
        ).toBe(true);
    });

    it('returns true when externally managed subscription selects same plan with a coupon', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.iOS,
        });

        expect(
            isSubscriptionCheckForbidden(subscription, {
                planIDs: { [PLANS.LUMO]: 1 },
                cycle: CYCLE.MONTHLY,
                coupon: 'TEST_COUPON',
            })
        ).toBe(true);
    });

    it('still returns true when coupon is an empty string (treated as no coupon)', () => {
        const planIDs = { [PLANS.MAIL]: 1 };
        const cycle = CYCLE.MONTHLY;
        const currency = 'USD';

        expect(
            isSubscriptionCheckForbidden(
                buildSubscription({
                    planIDs,
                    cycle,
                    currency,
                }),
                {
                    planIDs,
                    cycle,
                    coupon: '',
                }
            )
        ).toBe(true);
    });

    it('returns false for free subscription', () => {
        const freeSubscription = FREE_SUBSCRIPTION;
        const planIDs = {};

        expect(isSubscriptionCheckForbidden(freeSubscription, { planIDs, cycle: CYCLE.MONTHLY })).toBe(false);
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

        expect(isSubscriptionCheckForbidden(subscription, { planIDs: currentPlanIds, cycle: CYCLE.TWO_YEARS })).toBe(
            true
        );
        expect(isSubscriptionCheckForbidden(subscription, { planIDs: upcomingPlanIds, cycle: CYCLE.YEARLY })).toBe(
            true
        );
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

        expect(isSubscriptionCheckForbidden(subscription, { planIDs: currentPlanIds, cycle: Cycle })).toBe(false);

        expect(isSubscriptionCheckForbidden(subscription, { planIDs: upcomingPlanIds, cycle: Cycle })).toBe(true);
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

        expect(isSubscriptionCheckForbidden(subscription, { planIDs: currentPlanIds, cycle: CYCLE.MONTHLY })).toBe(
            true
        );
        expect(isSubscriptionCheckForbidden(subscription, { planIDs: upcomingPlanIds, cycle: CYCLE.YEARLY })).toBe(
            true
        );
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

        expect(isSubscriptionCheckForbidden(subscription, { planIDs: differentPlanIds, cycle: CYCLE.MONTHLY })).toBe(
            false
        );
        expect(isSubscriptionCheckForbidden(subscription, { planIDs: differentPlanIds, cycle: CYCLE.YEARLY })).toBe(
            false
        );
    });

    it('should return true when user has externally managed Lumo subscription and selects the same plan', () => {
        const subscribtion = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.iOS,
        });

        expect(isSubscriptionCheckForbidden(subscribtion, { planIDs: { [PLANS.LUMO]: 1 }, cycle: CYCLE.MONTHLY })).toBe(
            true
        );
        expect(isSubscriptionCheckForbidden(subscribtion, { planIDs: { [PLANS.LUMO]: 1 }, cycle: CYCLE.YEARLY })).toBe(
            true
        );
        expect(
            isSubscriptionCheckForbidden(subscribtion, { planIDs: { [PLANS.LUMO]: 1 }, cycle: CYCLE.TWO_YEARS })
        ).toBe(true);
    });

    it('should return false when user has externally managed Lumo subscription and selects a different plan', () => {
        const subscription = buildSubscription(PLANS.LUMO, {
            External: SubscriptionPlatform.iOS,
        });

        expect(isSubscriptionCheckForbidden(subscription, { planIDs: { [PLANS.MAIL]: 1 }, cycle: CYCLE.MONTHLY })).toBe(
            false
        );
        expect(isSubscriptionCheckForbidden(subscription, { planIDs: { [PLANS.MAIL]: 1 }, cycle: CYCLE.YEARLY })).toBe(
            false
        );
        expect(
            isSubscriptionCheckForbidden(subscription, { planIDs: { [PLANS.MAIL]: 1 }, cycle: CYCLE.TWO_YEARS })
        ).toBe(false);
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

        expect(isSubscriptionCheckForbidden(subscribtion, { planIDs: { [PLANS.LUMO]: 1 }, cycle: CYCLE.MONTHLY })).toBe(
            true
        );
        expect(isSubscriptionCheckForbidden(subscribtion, { planIDs: { [PLANS.LUMO]: 1 }, cycle: CYCLE.YEARLY })).toBe(
            false
        );
        expect(
            isSubscriptionCheckForbidden(subscribtion, { planIDs: { [PLANS.LUMO]: 1 }, cycle: CYCLE.TWO_YEARS })
        ).toBe(false);
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
            expect(
                isSubscriptionCheckForbidden(subscription, { planIDs: { [PLANS.DUO]: 1 }, cycle: CYCLE.MONTHLY })
            ).toBe(true);
            expect(
                isSubscriptionCheckForbidden(subscription, { planIDs: { [PLANS.FAMILY]: 1 }, cycle: CYCLE.MONTHLY })
            ).toBe(true);
            expect(
                isSubscriptionCheckForbidden(subscription, { planIDs: { [PLANS.VISIONARY]: 1 }, cycle: CYCLE.MONTHLY })
            ).toBe(true);
            expect(
                isSubscriptionCheckForbidden(subscription, {
                    planIDs: { [PLANS.PASS_FAMILY]: 1 },
                    cycle: CYCLE.MONTHLY,
                })
            ).toBe(true);
        }
    );
});

describe('isSubscriptionCheckForbiddenWithReason', () => {
    it('should return false amd possibly-invalid-coupon reason when the same plan+cycle is selected and the coupon is present', () => {
        const planIDs = { [PLANS.MAIL]: 1 };
        const cycle = CYCLE.MONTHLY;
        const currency = 'USD';
        const subscription = buildSubscription({ planIDs, cycle, currency });

        expect(isSubscriptionCheckForbiddenWithReason(subscription, { planIDs, cycle, coupon: 'TEST_COUPON' })).toEqual(
            {
                forbidden: false,
                reason: 'possibly-invalid-coupon',
            }
        );
    });
});

describe('isDangerouslyAllowedSubscriptionEstimation', () => {
    it('should return true when the same plan+cycle is selected and a coupon is present', () => {
        const planIDs = { [PLANS.MAIL]: 1 };
        const cycle = CYCLE.MONTHLY;
        const currency = 'USD';
        const subscription = buildSubscription({ planIDs, cycle, currency });

        expect(
            isDangerouslyAllowedSubscriptionEstimation(subscription, { planIDs, cycle, coupon: 'TEST_COUPON' })
        ).toBe(true);
    });

    it('should return false when the same plan+cycle is selected without a coupon', () => {
        const planIDs = { [PLANS.MAIL]: 1 };
        const cycle = CYCLE.MONTHLY;
        const currency = 'USD';
        const subscription = buildSubscription({ planIDs, cycle, currency });

        expect(isDangerouslyAllowedSubscriptionEstimation(subscription, { planIDs, cycle })).toBe(false);
    });

    it('should return false when a different plan is selected even with a coupon', () => {
        const currentPlanIDs = { [PLANS.MAIL]: 1 };
        const newPlanIDs = { [PLANS.DRIVE]: 1 };
        const cycle = CYCLE.MONTHLY;
        const currency = 'USD';
        const subscription = buildSubscription({ planIDs: currentPlanIDs, cycle, currency });

        expect(
            isDangerouslyAllowedSubscriptionEstimation(subscription, {
                planIDs: newPlanIDs,
                cycle,
                coupon: 'TEST_COUPON',
            })
        ).toBe(false);
    });

    it('should return false when subscription is null', () => {
        const planIDs = { [PLANS.MAIL]: 1 };
        const cycle = CYCLE.MONTHLY;

        expect(isDangerouslyAllowedSubscriptionEstimation(null, { planIDs, cycle, coupon: 'TEST_COUPON' })).toBe(false);
    });
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
