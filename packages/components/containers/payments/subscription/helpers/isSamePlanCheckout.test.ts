import { ADDON_NAMES, FREE_SUBSCRIPTION, PLANS, type PlanIDs } from '@proton/payments';
import { type Plan } from '@proton/shared/lib/interfaces';
import { buildSubscription } from '@proton/testing/builders';
import { getTestPlans } from '@proton/testing/data';

import { isSamePlanCheckout } from './isSamePlanCheckout';

describe('isSamePlanCheckout', () => {
    const testPlans = getTestPlans('USD');

    it('should return true for the same plan', () => {
        const mailPlan = testPlans.find((plan) => plan.Name === PLANS.MAIL) as Plan;
        expect(mailPlan).toBeDefined();

        const subscription = buildSubscription({
            Plans: [mailPlan],
        });
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };

        expect(isSamePlanCheckout(subscription, planIDs)).toBe(true);
    });

    it('should return false for different plans', () => {
        const mailPlan = testPlans.find((plan) => plan.Name === PLANS.MAIL) as Plan;
        expect(mailPlan).toBeDefined();

        const subscription = buildSubscription({
            Plans: [mailPlan],
        });
        const planIDs: PlanIDs = { [PLANS.DRIVE]: 1 };

        expect(isSamePlanCheckout(subscription, planIDs)).toBe(false);
    });

    it('should return false when upgrading from free to paid plan', () => {
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };

        expect(isSamePlanCheckout(FREE_SUBSCRIPTION, planIDs)).toBe(false);
    });

    it('should return true when staying on free plan', () => {
        const planIDs: PlanIDs = {};

        expect(isSamePlanCheckout(FREE_SUBSCRIPTION, planIDs)).toBe(true);
    });

    it('should handle undefined subscription', () => {
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };

        expect(isSamePlanCheckout(undefined, planIDs)).toBe(false);
    });

    it('should handle addons in the new plans', () => {
        const bundlePlan = testPlans.find((plan) => plan.Name === PLANS.BUNDLE) as Plan;
        expect(bundlePlan).toBeDefined();

        const subscription = buildSubscription({
            Plans: [bundlePlan],
        });
        const planIDs: PlanIDs = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 1 };

        expect(isSamePlanCheckout(subscription, planIDs)).toBe(false);
    });

    it('should handle addons in the old plans', () => {
        const mailProPlan = testPlans.find((plan) => plan.Name === PLANS.MAIL_PRO) as Plan;
        const memberMailProPlan = testPlans.find((plan) => plan.Name === ADDON_NAMES.MEMBER_MAIL_PRO) as Plan;
        expect(mailProPlan).toBeDefined();
        expect(memberMailProPlan).toBeDefined();

        const subscription = buildSubscription({
            Plans: [mailProPlan, memberMailProPlan],
        });

        const planIDs: PlanIDs = { [PLANS.MAIL_PRO]: 1 };
        expect(isSamePlanCheckout(subscription, planIDs)).toBe(true);

        const planIDs2: PlanIDs = { [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_MAIL_PRO]: 1 };
        expect(isSamePlanCheckout(subscription, planIDs2)).toBe(true);

        const planIDs3: PlanIDs = { [PLANS.MAIL_BUSINESS]: 1 };
        expect(isSamePlanCheckout(subscription, planIDs3)).toBe(false);

        const planIDs4: PlanIDs = { [PLANS.MAIL_BUSINESS]: 1, [ADDON_NAMES.MEMBER_MAIL_BUSINESS]: 1 };
        expect(isSamePlanCheckout(subscription, planIDs4)).toBe(false);
    });
});
