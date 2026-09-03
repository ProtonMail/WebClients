import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcShield2Bolt } from '@proton/icons/icons/IcShield2Bolt';
import { IcStorage } from '@proton/icons/icons/IcStorage';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getTestPlans } from '@proton/payments/testing/data-plans';

import type { Feature } from './helpers/getPlanFeatures';
import { useUpsellModal } from './useUpsellModal';

const expectedResult = {
    currency: 'CHF' as Currency,
    downgradedPlanAmount: 999,
    downgradedPlanName: 'Proton Unlimited',
    freePlanFeatures: [
        {
            icon: IcStorage,
            text: '0.5 GB email storage',
        },
        {
            icon: IcEnvelope,
            text: '1 email address',
        },
    ] as Feature[],
    freePlanTitle: 'Free',
    upsellPlanAmount: 399,
    upsellPlanFeatures: [
        {
            icon: IcStorage,
            text: '15 GB email storage',
        },
        {
            icon: IcEnvelope,
            text: '10 email addresses',
        },
        {
            icon: IcGlobe,
            text: '1 custom email domain',
        },
        {
            icon: IcFolders,
            text: 'Folders, labels, and custom filters',
        },
        {
            icon: IcShield2Bolt,
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
