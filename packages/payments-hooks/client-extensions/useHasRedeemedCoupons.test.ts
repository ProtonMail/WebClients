import { renderHook, waitFor } from '@testing-library/react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useApi } from '@proton/app-context/useApi';
import { PLANS, PLAN_TYPES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';

import { useHasRedeemedCoupons } from './useHasRedeemedCoupons';

jest.mock('@proton/account/allSubscriptions/hooks');
const mockUseAllSubscriptions = useAllSubscriptions as jest.Mock;

jest.mock('@proton/app-context/useApi');
const mockUseApi = useApi as jest.Mock;

const COUPONS = ['SALE', 'SALECS'];

const buildSubscription = (plan: PLANS) => {
    return { Plans: [{ Type: PLAN_TYPES.PLAN, Name: plan }] } as unknown as Subscription;
};

describe('useHasRedeemedCoupons', () => {
    let mockApi: jest.Mock;

    beforeEach(() => {
        mockApi = jest.fn();
        mockUseApi.mockReturnValue(mockApi);
        mockUseAllSubscriptions.mockReturnValue([[buildSubscription(PLANS.BUNDLE)], false]);
    });

    it('does not request the redemption history when disabled', () => {
        const { result } = renderHook(() => useHasRedeemedCoupons({ coupons: COUPONS, enabled: false }));

        expect(mockApi).not.toHaveBeenCalled();
        expect(result.current).toEqual({ hasRedeemed: false, loading: false });
    });

    it('does not request the redemption history without coupons', () => {
        const { result } = renderHook(() => useHasRedeemedCoupons({ coupons: [] }));

        expect(mockApi).not.toHaveBeenCalled();
        expect(result.current).toEqual({ hasRedeemed: false, loading: false });
    });

    it('silently requests the given coupons', () => {
        mockApi.mockReturnValue(new Promise(() => {}));

        renderHook(() => useHasRedeemedCoupons({ coupons: COUPONS }));

        expect(mockApi).toHaveBeenCalledWith(
            expect.objectContaining({
                url: 'payments/v5/coupons/redemptions',
                method: 'get',
                params: { Codes: 'SALE,SALECS' },
                silence: true,
            })
        );
    });

    it('reports loading until the redemption history arrives', () => {
        mockApi.mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useHasRedeemedCoupons({ coupons: COUPONS }));

        expect(result.current).toEqual({ hasRedeemed: false, loading: true });
    });

    it('reports loading before the first response when the subscription has not loaded', () => {
        mockUseAllSubscriptions.mockReturnValue([undefined, true]);
        mockApi.mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useHasRedeemedCoupons({ coupons: COUPONS }));

        expect(result.current).toEqual({ hasRedeemed: false, loading: true });
    });

    it('is redeemed when the history returns one of the coupons', async () => {
        mockApi.mockResolvedValue({ Redemptions: [{ Code: 'SALE', Redemptions: 1 }] });

        const { result } = renderHook(() => useHasRedeemedCoupons({ coupons: COUPONS }));

        await waitFor(() => {
            expect(result.current).toEqual({ hasRedeemed: true, loading: false });
        });
    });

    it('is not redeemed when the history returns no coupon', async () => {
        mockApi.mockResolvedValue({ Redemptions: [] });

        const { result } = renderHook(() => useHasRedeemedCoupons({ coupons: COUPONS }));

        await waitFor(() => {
            expect(result.current).toEqual({ hasRedeemed: false, loading: false });
        });
    });

    it('counts a failed request as not redeemed', async () => {
        mockApi.mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useHasRedeemedCoupons({ coupons: COUPONS }));

        await waitFor(() => {
            expect(result.current).toEqual({ hasRedeemed: false, loading: false });
        });
    });

    it('requests the history again when the subscription changes', async () => {
        mockApi.mockResolvedValueOnce({ Redemptions: [] });

        const { result, rerender } = renderHook(() => useHasRedeemedCoupons({ coupons: COUPONS }));

        await waitFor(() => {
            expect(result.current).toEqual({ hasRedeemed: false, loading: false });
        });

        mockApi.mockResolvedValueOnce({ Redemptions: [{ Code: 'SALE', Redemptions: 1 }] });
        mockUseAllSubscriptions.mockReturnValue([[buildSubscription(PLANS.DUO)], false]);
        rerender();

        expect(result.current).toEqual({ hasRedeemed: false, loading: true });

        await waitFor(() => {
            expect(result.current).toEqual({ hasRedeemed: true, loading: false });
        });
        expect(mockApi).toHaveBeenCalledTimes(2);
    });

    it('does not request the history again when the subscriptions are refetched unchanged', async () => {
        mockApi.mockResolvedValue({ Redemptions: [] });

        const { result, rerender } = renderHook(() => useHasRedeemedCoupons({ coupons: COUPONS }));

        await waitFor(() => {
            expect(result.current).toEqual({ hasRedeemed: false, loading: false });
        });

        mockUseAllSubscriptions.mockReturnValue([[buildSubscription(PLANS.BUNDLE)], false]);
        rerender();

        expect(result.current).toEqual({ hasRedeemed: false, loading: false });
        expect(mockApi).toHaveBeenCalledTimes(1);
    });

    it('aborts the previous request when the coupons change', () => {
        mockApi.mockReturnValue(new Promise(() => {}));

        const { rerender } = renderHook(({ coupons }) => useHasRedeemedCoupons({ coupons }), {
            initialProps: { coupons: ['SALE'] },
        });

        const [{ signal }] = mockApi.mock.calls[0];
        expect(signal.aborted).toBe(false);

        rerender({ coupons: ['OTHER'] });

        expect(signal.aborted).toBe(true);
    });

    it('does not request the history again when given a new array with the same coupons', async () => {
        mockApi.mockResolvedValue({ Redemptions: [] });

        const { result, rerender } = renderHook(() => useHasRedeemedCoupons({ coupons: ['SALE', 'SALECS'] }));

        await waitFor(() => {
            expect(result.current).toEqual({ hasRedeemed: false, loading: false });
        });

        rerender();

        expect(result.current).toEqual({ hasRedeemed: false, loading: false });
        expect(mockApi).toHaveBeenCalledTimes(1);
    });

    it('requests the history again when the coupons change', async () => {
        mockApi.mockResolvedValueOnce({ Redemptions: [] });

        const { result, rerender } = renderHook(({ coupons }) => useHasRedeemedCoupons({ coupons }), {
            initialProps: { coupons: ['SALE'] },
        });

        await waitFor(() => {
            expect(result.current).toEqual({ hasRedeemed: false, loading: false });
        });

        mockApi.mockResolvedValueOnce({ Redemptions: [{ Code: 'OTHER', Redemptions: 1 }] });
        rerender({ coupons: ['OTHER'] });

        expect(result.current).toEqual({ hasRedeemed: false, loading: true });

        await waitFor(() => {
            expect(result.current).toEqual({ hasRedeemed: true, loading: false });
        });
        expect(mockApi).toHaveBeenLastCalledWith(expect.objectContaining({ params: { Codes: 'OTHER' } }));
    });
});
