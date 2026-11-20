import { PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getTestPlans } from '@proton/payments/testing/data-plans';

import { getSummaryPlan } from './configuration';

const mockIsEnabled = vi.fn();
vi.mock('@proton/unleash/standaloneClient', () => ({
    getStandaloneUnleashClient: () => ({ isEnabled: mockIsEnabled }),
}));

describe('getSummaryPlan', () => {
    const plans = getTestPlans('EUR');

    // Sales-provisioned VPN links sign up through this flow, whose price summary needs the plan.
    it.each([PLANS.VPN_PRO, PLANS.VPN_BUSINESS])('has a summary for %s', (planName) => {
        const plan = plans.find(({ Name }) => Name === planName);

        const summaryPlan = getSummaryPlan({ app: undefined, plan, freePlan: FREE_PLAN, existingUser: false });

        expect(summaryPlan).toMatchObject({ plan: { Name: planName }, title: plan?.Title });
    });
});

describe('getSummaryPlan for the Lumo tiers', () => {
    it('carries the intro of the Lumo Plus lines with LumoPlans2026 on', () => {
        mockIsEnabled.mockImplementation((flag: string) => flag === 'LumoPlans2026');
        const plan = getTestPlans('EUR').find(({ Name }) => Name === PLANS.LUMO);

        const summaryPlan = getSummaryPlan({ app: undefined, plan, freePlan: FREE_PLAN, existingUser: false });

        expect(summaryPlan?.featuresIntro).toBe('Everything in Basic, and:');
        expect(summaryPlan?.features.map(({ text }) => text)).toEqual([
            '2x Basic usage',
            'Extended image generation',
            'Maximum Skills and Projects',
        ]);
    });

    it('has no intro with LumoPlans2026 off', () => {
        mockIsEnabled.mockReturnValue(false);
        const plan = getTestPlans('EUR').find(({ Name }) => Name === PLANS.LUMO);

        const summaryPlan = getSummaryPlan({ app: undefined, plan, freePlan: FREE_PLAN, existingUser: false });

        expect(summaryPlan?.featuresIntro).toBeUndefined();
    });
});
