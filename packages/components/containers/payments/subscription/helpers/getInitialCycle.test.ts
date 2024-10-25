import { type FullPlansMap, PLANS, type PlanIDs, getPlansMap } from '@proton/payments';
import { APPS, CYCLE, FREE_SUBSCRIPTION } from '@proton/shared/lib/constants';
import type { Plan, SubscriptionModel } from '@proton/shared/lib/interfaces';
import { buildSubscription } from '@proton/testing/builders';
import { getTestPlans } from '@proton/testing/data';

import { getInitialCycle } from './getInitialCycle';

describe('getInitialCycle', () => {
    const mockPlansMap: FullPlansMap = getPlansMap(getTestPlans(), 'USD', false);

    const mockSubscription = buildSubscription({
        Cycle: CYCLE.MONTHLY,
        Currency: 'USD',
    });

    const defaultPlanIDs: PlanIDs = {};

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
            allowDowncycling: false,
        });
        expect(result).toBe(CYCLE.YEARLY);
    });

    it('should return the provided cycle parameter if present', () => {
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
            allowDowncycling: false,
        });
        expect(result).toBe(CYCLE.TWO_YEARS);
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
            allowDowncycling: false,
        });
        expect(result).toBe(CYCLE.YEARLY); // Assuming DEFAULT_CYCLE is YEARLY
    });

    it('should handle upcoming subscription cycle', () => {
        const subscriptionWithUpcoming: SubscriptionModel = {
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
            allowDowncycling: false,
        });
        expect(result).toBe(CYCLE.YEARLY);
    });

    it('should respect minimum cycle', () => {
        const result = getInitialCycle({
            cycleParam: CYCLE.MONTHLY,
            subscription: mockSubscription,
            planIDs: defaultPlanIDs,
            plansMap: mockPlansMap,
            isPlanSelection: false,
            app: APPS.PROTONMAIL,
            minimumCycle: CYCLE.YEARLY,
            maximumCycle: undefined,
            currency: 'USD',
            allowDowncycling: false,
        });
        expect(result).toBe(CYCLE.YEARLY);
    });

    it('should respect maximum cycle', () => {
        const result = getInitialCycle({
            cycleParam: CYCLE.TWO_YEARS,
            subscription: mockSubscription,
            planIDs: defaultPlanIDs,
            plansMap: mockPlansMap,
            isPlanSelection: false,
            app: APPS.PROTONMAIL,
            minimumCycle: undefined,
            maximumCycle: CYCLE.YEARLY,
            currency: 'USD',
            allowDowncycling: false,
        });
        expect(result).toBe(CYCLE.YEARLY);
    });

    it('should handle custom cycles', () => {
        const subscriptionWithCustomCycle: SubscriptionModel = {
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
            allowDowncycling: false,
        });
        expect(result).toBe(CYCLE.YEARLY); // Assuming it falls back to YEARLY
    });

    it('should return the preferred cycle even if the current subscription has a higher cycle - only if subscription plan and selected plan are different', () => {
        const mailPlan = getTestPlans('USD').find((it) => it.Name === PLANS.MAIL) as Plan;
        expect(mailPlan).toBeDefined();

        const subscriptionMock = buildSubscription({
            Plans: [mailPlan],
            Cycle: CYCLE.TWO_YEARS,
        });

        const planIDs: PlanIDs = {
            [PLANS.BUNDLE]: 1,
        };

        const result = getInitialCycle({
            cycleParam: CYCLE.YEARLY,
            subscription: subscriptionMock,
            planIDs,
            plansMap: mockPlansMap,
            isPlanSelection: true,
            app: APPS.PROTONMAIL,
            minimumCycle: undefined,
            maximumCycle: undefined,
            currency: 'USD',
            allowDowncycling: false,
        });

        expect(result).toBe(CYCLE.YEARLY);
    });
});
