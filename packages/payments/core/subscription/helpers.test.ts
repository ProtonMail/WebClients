import { type Plan } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { buildSubscription, buildUser } from '@proton/testing/builders';

import { FREE_SUBSCRIPTION, PLANS, PLAN_NAMES, PLAN_TYPES } from '../constants';
import { getSubscriptionPlanTitle } from './helpers';

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
