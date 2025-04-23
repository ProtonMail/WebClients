import { buildSubscription, buildUser } from '@proton/testing/builders';
import { getSubscriptionMock } from '@proton/testing/data';

import { CYCLE, FREE_SUBSCRIPTION, PLANS, PLAN_NAMES, PLAN_TYPES } from '../constants';
import { type PlanIDs } from '../interface';
import { type Plan } from '../plan/interface';
import { FREE_PLAN } from './freePlans';
import { getPlanIDs, getSubscriptionPlanTitle, isSubscriptionUnchanged } from './helpers';

describe('getSubscriptionPlanTitle', () => {
    it('should return plan title and name for a paid user with subscription', () => {
        const subscription = buildSubscription({
            Plans: [
                {
                    Name: PLANS.MAIL,
                    Title: PLAN_NAMES[PLANS.MAIL],
                    Type: PLAN_TYPES.PLAN,
                } as Plan,
            ],
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
        const subscription = buildSubscription({
            Plans: [
                {
                    Name: PLANS.MAIL,
                    Title: PLAN_NAMES[PLANS.MAIL],
                    Type: PLAN_TYPES.PLAN,
                } as Plan,
            ],
            CouponCode: 'LIFETIME',
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
        const subscription = getSubscriptionMock();
        const planIds: PlanIDs = getPlanIDs(subscription); // Assuming getPlanIDs is a function that extracts plan IDs from a subscription

        const result = isSubscriptionUnchanged(subscription, planIds);
        expect(result).toBe(true);
    });

    it('returns false when subscription and planIds are not deeply equal', () => {
        const subscription = getSubscriptionMock();
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
        const subscription = getSubscriptionMock();

        const result = isSubscriptionUnchanged(subscription, null as any);
        expect(result).toBe(false);
    });

    it('should return true when cycle is the same as in the subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;

        const planIds: PlanIDs = getPlanIDs(subscription);

        const result = isSubscriptionUnchanged(subscription, planIds, CYCLE.MONTHLY);
        expect(result).toBe(true);
    });

    it('should return false when cycle is different from the subscription', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;

        const planIds: PlanIDs = getPlanIDs(subscription);

        const result = isSubscriptionUnchanged(subscription, planIds, CYCLE.YEARLY);
        expect(result).toBe(false);
    });

    it('should return true if the upcoming subscription unchanged', () => {
        const subscription = getSubscriptionMock();
        subscription.Cycle = CYCLE.MONTHLY;
        subscription.UpcomingSubscription = getSubscriptionMock();
        subscription.UpcomingSubscription.Cycle = CYCLE.YEARLY;

        const planIds: PlanIDs = getPlanIDs(subscription);

        const currentSubscriptionUnchanged = isSubscriptionUnchanged(subscription, planIds, CYCLE.MONTHLY);
        expect(currentSubscriptionUnchanged).toBe(true);

        const upcomingSubscriptionUnchanged = isSubscriptionUnchanged(subscription, planIds, CYCLE.YEARLY);
        expect(upcomingSubscriptionUnchanged).toBe(true);
    });

    it('should return false if there is no upcoming subscription', () => {
        const subscription = getSubscriptionMock();
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
