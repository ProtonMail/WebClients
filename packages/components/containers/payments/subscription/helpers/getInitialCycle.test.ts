import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import type { Plan } from '@proton/payments/core/plan/interface';
import type { FullPlansMap, Subscription } from '@proton/payments/core/subscription/interface';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getLongTestPlans, getTestPlans } from '@proton/payments/testing/data-plans';
import { APPS } from '@proton/shared/lib/constants';

import { getInitialCycle } from './getInitialCycle';

describe('getInitialCycle', () => {
    let mockPlansMap: FullPlansMap;

    beforeEach(() => {
        mockPlansMap = getPlansMap(getLongTestPlans(), 'USD', false);
    });

    const mockSubscription = buildSubscription({
        planName: PLANS.BUNDLE,
        cycle: CYCLE.MONTHLY,
        currency: 'USD',
    });

    const defaultPlanIDs: PlanIDs = {
        [PLANS.MAIL]: 1,
    };

    it('should return YEARLY for Proton Pass', () => {
        const result = getInitialCycle({
            cycleParam: undefined,
            subscription: FREE_SUBSCRIPTION,
            planIDs: defaultPlanIDs,
            plansMap: mockPlansMap,
            isPlanSelection: true,
            app: APPS.PROTONPASS,
            minimumCycle: undefined,
            maximumCycle: undefined,
            currency: 'USD',
        });
        expect(result).toBe(CYCLE.YEARLY);
    });

    it('should return lower cycle if 2 years is not available', () => {
        mockPlansMap[PLANS.MAIL].Pricing = {
            1: mockPlansMap[PLANS.MAIL].Pricing[1],
            12: mockPlansMap[PLANS.MAIL].Pricing[12],
        };

        const result = getInitialCycle({
            cycleParam: CYCLE.TWO_YEARS,
            subscription: mockSubscription,
            planIDs: defaultPlanIDs,
            plansMap: mockPlansMap,
            isPlanSelection: true,
            app: APPS.PROTONMAIL,
            minimumCycle: undefined,
            maximumCycle: undefined,
            currency: 'USD',
        });
        expect(result).toBe(CYCLE.YEARLY);
    });

    it('should return the provided cycle parameter if present', () => {
        const result = getInitialCycle({
            cycleParam: CYCLE.YEARLY,
            subscription: mockSubscription,
            planIDs: defaultPlanIDs,
            plansMap: mockPlansMap,
            isPlanSelection: true,
            app: APPS.PROTONMAIL,
            minimumCycle: undefined,
            maximumCycle: undefined,
            currency: 'USD',
        });
        expect(result).toBe(CYCLE.YEARLY);
    });

    it('should return DEFAULT_CYCLE for free subscriptions', () => {
        const result = getInitialCycle({
            cycleParam: undefined,
            subscription: FREE_SUBSCRIPTION,
            planIDs: defaultPlanIDs,
            plansMap: mockPlansMap,
            isPlanSelection: false,
            app: APPS.PROTONMAIL,
            minimumCycle: undefined,
            maximumCycle: undefined,
            currency: 'USD',
        });
        expect(result).toBe(CYCLE.YEARLY); // Assuming DEFAULT_CYCLE is YEARLY
    });

    it('should handle upcoming subscription cycle', () => {
        const subscriptionWithUpcoming: Subscription = {
            ...mockSubscription,
            UpcomingSubscription: {
                ...mockSubscription,
                Cycle: CYCLE.YEARLY,
            },
        };
        const result = getInitialCycle({
            cycleParam: undefined,
            subscription: subscriptionWithUpcoming,
            planIDs: defaultPlanIDs,
            plansMap: mockPlansMap,
            isPlanSelection: false,
            app: APPS.PROTONMAIL,
            minimumCycle: undefined,
            maximumCycle: undefined,
            currency: 'USD',
        });
        expect(result).toBe(CYCLE.YEARLY);
    });

    it('should handle custom cycles', () => {
        const subscriptionWithCustomCycle: Subscription = {
            ...mockSubscription,
            Cycle: CYCLE.FIFTEEN,
        };
        const result = getInitialCycle({
            cycleParam: undefined,
            subscription: subscriptionWithCustomCycle,
            planIDs: defaultPlanIDs,
            plansMap: mockPlansMap,
            isPlanSelection: false,
            app: APPS.PROTONMAIL,
            minimumCycle: undefined,
            maximumCycle: undefined,
            currency: 'USD',
        });
        expect(result).toBe(CYCLE.YEARLY); // Assuming it falls back to YEARLY
    });

    it('should return the preferred cycle even if the current subscription has a higher cycle - only if subscription plan and selected plan are different', () => {
        const mailPlan = getTestPlans('USD').find((it) => it.Name === PLANS.MAIL) as Plan;
        expect(mailPlan).toBeDefined();

        const subscription = buildSubscription({
            planName: PLANS.BUNDLE,
            cycle: CYCLE.TWO_YEARS,
            currency: 'USD',
        });

        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const result = getInitialCycle({
            cycleParam: CYCLE.YEARLY,
            subscription,
            planIDs,
            plansMap: mockPlansMap,
            isPlanSelection: true,
            app: APPS.PROTONMAIL,
            minimumCycle: undefined,
            maximumCycle: undefined,
            currency: 'USD',
        });

        expect(result).toBe(CYCLE.YEARLY);
    });
});
