import type { CheckSubscriptionData } from '@proton/payments/core/api/api';
import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import type { PaymentsApi } from '@proton/payments/core/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { getBusinessReferralRedirect, getSubscriptionPrices } from './helper';

const getPaymentsApiMock = () => {
    const checkSubscription = vi.fn(async (data: CheckSubscriptionData) => ({ requestData: data }) as any);
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

describe('getBusinessReferralRedirect', () => {
    it.each([
        ['/signup/business', 'bundlepro2024'],
        ['/signup/business', 'bundlebiz2025'],
        ['/drive/signup/business', 'drivebiz2024'],
        ['/meet/signup/business', 'meetbiz2025'],
        ['/pass/signup/business', 'passbiz2024'],
        ['/vpn/signup/business', 'vpnbiz2023'],
        ['/lumo/signup/business', 'lumobiz2025'],
        ['/mail/signup/business', 'bundlepro2024'],
        ['/mail/signup/business', 'bundlebiz2025'],
        ['/pass/signup/business', 'bundlepro2024'],
        ['/pass/signup/business', 'bundlebiz2025'],
        ['/vpn/signup/business', 'bundlepro2024'],
        ['/vpn/signup/business', 'bundlebiz2025'],
        ['/drive/signup/business', 'bundlepro2024'],
        ['/drive/signup/business', 'bundlebiz2025'],
    ])('redirects %s with a referrer to the business referral signup', (pathname, plan) => {
        const search = `?plan=${plan}&currency=EUR&referrer=ABC123&email=user%40example.com&billing=12&utm_source=newsletter`;

        expect(getBusinessReferralRedirect({ pathname, search })).toEqual({
            pathname: '/business-referral/signup',
            search: `plan=${plan}&currency=EUR&referrer=ABC123&email=user%40example.com`,
        });
    });

    it('does not redirect a Drive business link without a referrer', () => {
        const redirect = getBusinessReferralRedirect({
            pathname: '/drive/signup/business',
            search: '?plan=drivebiz2024&currency=EUR',
        });

        expect(redirect).toBeUndefined();
    });

    it('does not redirect the invalid-referrer fallback back into the referral signup', () => {
        expect(getBusinessReferralRedirect({ pathname: '/signup/business', search: '' })).toBeUndefined();
    });
});

describe('getSubscriptionPrices ProvisioningToken', () => {
    const baseParams = {
        currency: 'USD',
        VatId: undefined,
        planIDs: { [PLANS.BUNDLE_PRO_2024]: 5 },
        cycle: CYCLE.YEARLY,
        coupon: 'SALESDEAL',
    } as const;

    it('sends the provisioning token so the deal coupon is priced', async () => {
        const { paymentsApi, checkSubscription } = getPaymentsApiMock();

        await getSubscriptionPrices({ ...baseParams, paymentsApi, provisioningToken: 'token' });

        expect(checkSubscription.mock.calls[0][0].ProvisioningToken).toBe('token');
    });

    it('does not send a provisioning token outside a provisioned link', async () => {
        const { paymentsApi, checkSubscription } = getPaymentsApiMock();

        await getSubscriptionPrices({ ...baseParams, paymentsApi });

        expect(checkSubscription.mock.calls[0][0]).not.toHaveProperty('ProvisioningToken');
    });
});
