import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/payments/core/billing-address/billing-address';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import {
    buildLumoSubscription,
    buildMultiSubscriptionContext,
} from '@proton/payments/testing/buildMultiSubscriptionContext';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';

import { checkMultiplePlans } from './helpers';

describe('checkMultiplePlans', () => {
    const webMailPlus = buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.YEARLY, currency: 'CHF' });
    const webLumoPlus = {
        ...buildLumoSubscription(PLANS.LUMO, { ID: 'lumo-plus', Cycle: CYCLE.MONTHLY, Currency: 'CHF' }),
        UpcomingSubscription: buildLumoSubscription(PLANS.LUMO, { Cycle: CYCLE.YEARLY, Currency: 'CHF' }),
    };

    it('computes the optimistic result of a forbidden check against the subscription it changes', async () => {
        const paymentsApi = { multiCheck: vi.fn().mockResolvedValue([]) } as any;

        const [lumoPlusYearly] = await checkMultiplePlans({
            plansToCheck: [{ planIDs: { [PLANS.LUMO]: 1 }, cycle: CYCLE.YEARLY, currency: 'CHF' }],
            paymentsApi,
            multiCheckGroups: { addPromiseToGroup: vi.fn() } as any,
            getLocalizedPlansMap: () => getPlansMap(getLongTestPlans('CHF'), 'CHF', false),
            billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
            multiSubscriptionContext: buildMultiSubscriptionContext([webMailPlus, webLumoPlus]),
        });

        expect(paymentsApi.multiCheck).toHaveBeenCalledWith([], expect.any(Object));
        expect(lumoPlusYearly.SubscriptionMode).toBe(SubscriptionMode.ScheduledChargedImmediately);
    });
});
