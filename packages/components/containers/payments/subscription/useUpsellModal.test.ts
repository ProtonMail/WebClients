import { PLANS } from '@proton/payments';
import type { Currency } from '@proton/shared/lib/interfaces';

import { freePlan, plans, subscriptionBundlePro } from './__mocks__/data';
import type { Feature } from './helpers/getPlanFeatures';
import { useUpsellModal } from './useUpsellModal';

const expectedResult = {
    currency: 'CHF' as Currency,
    downgradedPlanAmount: 999,
    downgradedPlanName: 'Proton Unlimited',
    freePlanFeatures: [
        {
            icon: 'storage',
            text: '1 GB email storage',
        },
        {
            icon: 'envelope',
            text: '1 email address',
        },
    ] as Feature[],
    freePlanTitle: 'Proton Free',
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
            freePlan,
            plans,
            subscription: subscriptionBundlePro,
            upsellPlanId: PLANS.MAIL,
        });
        expect(actualResult).toEqual(expectedResult);
    });
});
