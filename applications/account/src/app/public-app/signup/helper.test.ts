import type { CheckSubscriptionData } from '@proton/payments/core/api/api';
import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import type { PaymentsApi } from '@proton/payments/core/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { getSubscriptionPrices } from './helper';

const getPaymentsApiMock = () => {
    const checkSubscription = jest.fn(async (data: CheckSubscriptionData) => ({ requestData: data }) as any);
    return { paymentsApi: { checkSubscription } as unknown as PaymentsApi, checkSubscription };
};

describe('getSubscriptionPrices ValidateGuards', () => {
    const bundleSubscription = buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency: 'USD' });
    const baseParams = { currency: 'USD', VatId: undefined } as const;

    it('sends ValidateGuards when the selection modifies a paid subscription', async () => {
        const { paymentsApi, checkSubscription } = getPaymentsApiMock();

        await getSubscriptionPrices({
            ...baseParams,
            paymentsApi,
            planIDs: { [PLANS.VPN2024]: 1 },
            cycle: CYCLE.YEARLY,
            subscription: bundleSubscription,
        });

        expect(checkSubscription).toHaveBeenCalledTimes(1);
        const payload = checkSubscription.mock.calls[0][0];
        expect(payload.ValidateGuards).toBe(true);
    });

    it('does not send ValidateGuards for a free subscription', async () => {
        const { paymentsApi, checkSubscription } = getPaymentsApiMock();

        await getSubscriptionPrices({
            ...baseParams,
            paymentsApi,
            planIDs: { [PLANS.VPN2024]: 1 },
            cycle: CYCLE.YEARLY,
            subscription: FREE_SUBSCRIPTION,
        });

        const payload = checkSubscription.mock.calls[0][0];
        expect(payload).not.toHaveProperty('ValidateGuards');
    });

    it('does not send ValidateGuards when no subscription is provided', async () => {
        const { paymentsApi, checkSubscription } = getPaymentsApiMock();

        await getSubscriptionPrices({
            ...baseParams,
            paymentsApi,
            planIDs: { [PLANS.VPN2024]: 1 },
            cycle: CYCLE.YEARLY,
        });

        const payload = checkSubscription.mock.calls[0][0];
        expect(payload).not.toHaveProperty('ValidateGuards');
    });

    it('does not send ValidateGuards when the selection equals the current subscription', async () => {
        const { paymentsApi, checkSubscription } = getPaymentsApiMock();

        await getSubscriptionPrices({
            ...baseParams,
            paymentsApi,
            planIDs: { [PLANS.BUNDLE]: 1 },
            cycle: CYCLE.YEARLY,
            subscription: bundleSubscription,
        });

        const payload = checkSubscription.mock.calls[0][0];
        expect(payload).not.toHaveProperty('ValidateGuards');
    });
});
