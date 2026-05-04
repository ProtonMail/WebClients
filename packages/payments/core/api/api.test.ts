import type { Api } from '@proton/shared/lib/interfaces';

import { ADDON_NAMES, PLANS } from '../constants';
import { SubscriptionPlatform } from '../subscription/constants';
import { fetchPreviousSubscription } from './api';

describe('fetchPreviousSubscription', () => {
    const buildApi = (response: unknown) => jest.fn().mockResolvedValue(response) as unknown as Api;

    it('returns null when Subscription is null', async () => {
        const api = buildApi({ Subscription: null });
        await expect(fetchPreviousSubscription(api)).resolves.toBeNull();
    });

    it('returns null when response is undefined', async () => {
        const api = buildApi(undefined);
        await expect(fetchPreviousSubscription(api)).resolves.toBeNull();
    });

    it('returns null when response is an empty object', async () => {
        const api = buildApi({});
        await expect(fetchPreviousSubscription(api)).resolves.toBeNull();
    });

    it('maps every PascalCase field to camelCase', async () => {
        const api = buildApi({
            Subscription: {
                Cycle: 12,
                Currency: 'USD',
                PeriodStart: 1700000000,
                PeriodEnd: 1700001000,
                CreateTime: 1699999000,
                CancelTime: 1700000500,
                CouponCode: 'BLACK_FRIDAY',
                External: SubscriptionPlatform.Default,
                IsTrial: true,
                Plans: [{ Name: PLANS.MAIL, Quantity: 1 }],
            },
        });

        await expect(fetchPreviousSubscription(api)).resolves.toEqual({
            cycle: 12,
            currency: 'USD',
            periodStart: 1700000000,
            periodEnd: 1700001000,
            createTime: 1699999000,
            cancelTime: 1700000500,
            couponCode: 'BLACK_FRIDAY',
            external: SubscriptionPlatform.Default,
            isTrial: true,
            plans: { [PLANS.MAIL]: 1 },
        });
    });

    it('reduces a single plan to PlanIDs', async () => {
        const api = buildApi({
            Subscription: {
                Cycle: 1,
                Currency: 'USD',
                PeriodStart: 0,
                PeriodEnd: 0,
                CreateTime: 0,
                CancelTime: 0,
                CouponCode: null,
                External: SubscriptionPlatform.Default,
                IsTrial: false,
                Plans: [{ Name: PLANS.MAIL, Quantity: 1 }],
            },
        });

        const result = await fetchPreviousSubscription(api);
        expect(result?.plans).toEqual({ [PLANS.MAIL]: 1 });
    });

    it('reduces multiple plans to PlanIDs preserving quantities', async () => {
        const api = buildApi({
            Subscription: {
                Cycle: 1,
                Currency: 'USD',
                PeriodStart: 0,
                PeriodEnd: 0,
                CreateTime: 0,
                CancelTime: 0,
                CouponCode: null,
                External: SubscriptionPlatform.Default,
                IsTrial: false,
                Plans: [
                    { Name: PLANS.MAIL, Quantity: 1 },
                    { Name: PLANS.VPN, Quantity: 2 },
                ],
            },
        });

        const result = await fetchPreviousSubscription(api);
        expect(result?.plans).toEqual({ [PLANS.MAIL]: 1, [PLANS.VPN]: 2 });
    });

    it('reduces a plan with addon preserving the addon quantity', async () => {
        const api = buildApi({
            Subscription: {
                Cycle: 1,
                Currency: 'USD',
                PeriodStart: 0,
                PeriodEnd: 0,
                CreateTime: 0,
                CancelTime: 0,
                CouponCode: null,
                External: SubscriptionPlatform.Default,
                IsTrial: false,
                Plans: [
                    { Name: PLANS.BUNDLE_PRO_2024, Quantity: 1 },
                    { Name: ADDON_NAMES.MEMBER_BUNDLE_PRO, Quantity: 5 },
                ],
            },
        });

        const result = await fetchPreviousSubscription(api);
        expect(result?.plans).toEqual({
            [PLANS.BUNDLE_PRO_2024]: 1,
            [ADDON_NAMES.MEMBER_BUNDLE_PRO]: 5,
        });
    });

    it('returns plans: {} when Plans field is missing', async () => {
        const api = buildApi({
            Subscription: {
                Cycle: 1,
                Currency: 'USD',
                PeriodStart: 0,
                PeriodEnd: 0,
                CreateTime: 0,
                CancelTime: 0,
                CouponCode: null,
                External: SubscriptionPlatform.Default,
                IsTrial: false,
            },
        });

        const result = await fetchPreviousSubscription(api);
        expect(result?.plans).toEqual({});
    });

    it.each([
        ['undefined', undefined, null],
        ['null', null, null],
        ['a string', 'COUPON', 'COUPON'],
    ])('normalizes CouponCode %s to %p', async (_label, input, expected) => {
        const api = buildApi({
            Subscription: {
                Cycle: 1,
                Currency: 'USD',
                PeriodStart: 0,
                PeriodEnd: 0,
                CreateTime: 0,
                CancelTime: 0,
                CouponCode: input,
                External: SubscriptionPlatform.Default,
                IsTrial: false,
                Plans: [],
            },
        });

        const result = await fetchPreviousSubscription(api);
        expect(result?.couponCode).toBe(expected);
    });

    it('propagates API rejections', async () => {
        const error = new Error('network down');
        const api = jest.fn().mockRejectedValue(error) as unknown as Api;
        await expect(fetchPreviousSubscription(api)).rejects.toBe(error);
    });

    it('issues GET payments/v6/subscription/latest', async () => {
        const api = jest.fn().mockResolvedValue({ Subscription: null });
        await fetchPreviousSubscription(api as unknown as Api);
        expect(api).toHaveBeenCalledTimes(1);
        expect(api).toHaveBeenCalledWith({
            url: 'payments/v6/subscription/latest',
            method: 'get',
        });
    });
});
