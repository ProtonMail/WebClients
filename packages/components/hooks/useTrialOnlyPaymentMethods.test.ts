import { renderHook, waitFor } from '@testing-library/react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { PLANS } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { useTrialOnlyPaymentMethods } from './useTrialOnlyPaymentMethods';

jest.mock('@proton/account/allSubscriptions/hooks', () => ({
    useAllSubscriptions: jest.fn(),
}));

jest.mock('@proton/account/paymentMethods/hooks', () => ({
    useGetPaymentMethods: jest.fn(),
}));

const savedMethod = { ID: 'method-1' } as SavedPaymentMethod;

describe('useTrialOnlyPaymentMethods', () => {
    const getPaymentMethods = jest.fn();

    const setup = (subscriptions: readonly Subscription[] | undefined) => {
        (useAllSubscriptions as jest.Mock).mockReturnValue([subscriptions, subscriptions === undefined]);
        return renderHook(() => useTrialOnlyPaymentMethods());
    };

    beforeEach(() => {
        jest.clearAllMocks();
        getPaymentMethods.mockResolvedValue([savedMethod]);
        (useGetPaymentMethods as jest.Mock).mockReturnValue(getPaymentMethods);
    });

    it.each([
        { name: 'loading', subscriptions: undefined },
        { name: 'no subscription', subscriptions: [] },
        { name: 'one paid subscription', subscriptions: [buildSubscription(PLANS.MAIL)] },
        {
            name: 'two paid subscriptions',
            subscriptions: [buildSubscription(PLANS.MAIL), buildSubscription(PLANS.PASS)],
        },
    ] as const)('does not fetch payment methods with $name', async ({ subscriptions }) => {
        const { result } = setup(subscriptions);

        await waitFor(() => expect(result.current).toBe(false));
        expect(getPaymentMethods).not.toHaveBeenCalled();
    });

    it.each([
        { name: 'one trial subscription', subscriptions: [buildSubscription(PLANS.BUNDLE, { IsTrial: true })] },
        {
            name: 'a paid subscription followed by a trial one',
            subscriptions: [buildSubscription(PLANS.MAIL), buildSubscription(PLANS.PASS, { IsTrial: true })],
        },
    ] as const)('returns true when the user has a saved payment method and $name', async ({ subscriptions }) => {
        const { result } = setup(subscriptions);

        await waitFor(() => expect(result.current).toBe(true));
        expect(getPaymentMethods).toHaveBeenCalledTimes(1);
    });

    it('returns false for a trial user without a saved payment method', async () => {
        getPaymentMethods.mockResolvedValue([]);
        const { result } = setup([buildSubscription(PLANS.MAIL), buildSubscription(PLANS.PASS, { IsTrial: true })]);

        await waitFor(() => expect(getPaymentMethods).toHaveBeenCalledTimes(1));
        expect(result.current).toBe(false);
    });

    it('returns false when fetching the payment methods fails', async () => {
        getPaymentMethods.mockRejectedValue(new Error('network'));
        const { result } = setup([buildSubscription(PLANS.BUNDLE, { IsTrial: true })]);

        await waitFor(() => expect(getPaymentMethods).toHaveBeenCalledTimes(1));
        expect(result.current).toBe(false);
    });
});
