import { CYCLE, PLANS } from '@proton/payments';
import type { Currency } from '@proton/payments';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { buildSubscription } from '@proton/testing/builders';
import { getTestPlans } from '@proton/testing/data';

import type { Feature } from './helpers/getPlanFeatures';
import { useUpsellModal } from './useUpsellModal';

const expectedResult = {
    currency: 'CHF' as Currency,
    downgradedPlanAmount: 999,
    downgradedPlanName: 'Proton Unlimited',
    freePlanFeatures: [
        {
            icon: 'storage',
            text: '0.5 GB email storage',
        },
        {
            icon: 'envelope',
            text: '1 email address',
        },
    ] as Feature[],
    freePlanTitle: 'Free',
    upsellPlanAmount: 399,
    upsellPlanFeatures: [
        {
            icon: 'storage',
            text: '15 GB email storage',
        },
        {
            icon: 'envelope',
            text: '10 email addresses',
        },
        {
            icon: 'globe',
            text: '1 custom email domain',
        },
        {
            icon: 'folders',
            text: 'Folders, labels, and custom filters',
        },
        {
            icon: 'shield-2-bolt',
            text: 'Dark Web Monitoring',
        },
    ] as Feature[],
    upsellPlanName: 'Mail Plus',
    upsellSavings: '60%',
};

describe('useUpsellModal', () => {
    test('given freePlan, plans, and subscription data and upsellPlanId, should return correct data', () => {
        const actualResult = useUpsellModal({
            freePlan: FREE_PLAN,
            plans: getTestPlans('CHF'),
            subscription: buildSubscription({
                planName: PLANS.BUNDLE,
                cycle: CYCLE.YEARLY,
                currency: 'CHF',
            }),
            upsellPlanId: PLANS.MAIL,
        });
        expect(actualResult).toEqual(expectedResult);
    });
});
