import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';

import { getForbiddenCheckFallback } from './usePaymentsApi';

describe('getForbiddenCheckFallback', () => {
    const plansMap = getPlansMap(getLongTestPlans('CHF'), 'CHF', false);
    const webMailPlus = buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' });
    const webLumoPlus = buildLumoSubscription(PLANS.LUMO, { ID: 'lumo-plus', Cycle: CYCLE.MONTHLY, Currency: 'CHF' });
    const multiSubscriptionContext = buildMultiSubscriptionContext([webMailPlus, webLumoPlus]);

    it('prices a refused check of Lumo Plus with the Lumo Plus price, not the Mail Plus one', () => {
        const lumoPlusMonthlyPrice = plansMap[PLANS.LUMO]?.Pricing[CYCLE.MONTHLY];

        const fallback = getForbiddenCheckFallback(
            { Plans: { [PLANS.LUMO]: 1 }, Cycle: CYCLE.MONTHLY, Currency: 'CHF' },
            multiSubscriptionContext,
            plansMap
        );

        expect(lumoPlusMonthlyPrice).not.toBe(plansMap[PLANS.MAIL]?.Pricing[CYCLE.MONTHLY]);
        expect(fallback?.Amount).toBe(lumoPlusMonthlyPrice);
        expect(fallback?.AmountDue).toBe(lumoPlusMonthlyPrice);
    });

    it('returns no fallback for an allowed check', () => {
        const fallback = getForbiddenCheckFallback(
            { Plans: { [PLANS.LUMO]: 1 }, Cycle: CYCLE.YEARLY, Currency: 'CHF' },
            multiSubscriptionContext,
            plansMap
        );

        expect(fallback).toBeNull();
    });
});
