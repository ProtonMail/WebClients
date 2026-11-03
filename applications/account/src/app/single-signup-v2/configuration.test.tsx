import { PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getTestPlans } from '@proton/payments/testing/data-plans';

import { getSummaryPlan } from './configuration';

describe('getSummaryPlan', () => {
    const plans = getTestPlans('EUR');

    // Sales-provisioned VPN links sign up through this flow, whose price summary needs the plan.
    it.each([PLANS.VPN_PRO, PLANS.VPN_BUSINESS])('has a summary for %s', (planName) => {
        const plan = plans.find(({ Name }) => Name === planName);

        const summaryPlan = getSummaryPlan({ app: undefined, plan, freePlan: FREE_PLAN, existingUser: false });

        expect(summaryPlan).toMatchObject({ plan: { Name: planName }, title: plan?.Title });
    });
});
