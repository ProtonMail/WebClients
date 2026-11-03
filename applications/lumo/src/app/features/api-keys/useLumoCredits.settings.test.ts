import { act, renderHook, waitFor } from '@testing-library/react';

import { useApi } from '@proton/app-context/useApi';
import type { LumoCreditResponse } from '@proton/payments/core/api/lumoCredit';
import { MOCK_LUMO_CREDIT_RESPONSE } from '@proton/payments/testing/lumo-credit';

import { useLumoCredits } from './useLumoCredits';

jest.mock('@proton/app-context/useApi');

const getUrl = 'payments/v5/products/lumo-credit';
const autoTopUpUrl = 'payments/v5/products/lumo-credit/auto-top-up';

const credits = (autoTopUp: Partial<LumoCreditResponse['AutoTopUp']> = {}): LumoCreditResponse => ({
    ...MOCK_LUMO_CREDIT_RESPONSE,
    AutoTopUp: { ...MOCK_LUMO_CREDIT_RESPONSE.AutoTopUp, ...autoTopUp },
});

const setup = (response: LumoCreditResponse, failingUrls: string[] = []) => {
    const api = jest.fn(({ url }: { url: string }) =>
        failingUrls.includes(url) ? Promise.reject(new Error(url)) : Promise.resolve(response)
    );
    (useApi as jest.Mock).mockReturnValue(api);
    const { result } = renderHook(() => useLumoCredits());
    return { api, result };
};

const callsTo = (api: jest.Mock, url: string) => api.mock.calls.filter(([config]) => config.url === url);

const savedSettings = {
    autoTopUp: { enabled: true, amount: 40, threshold: 20 },
    spendingLimit: { enabled: true, limit: 300 },
};

describe('useLumoCredits balance settings', () => {
    it('reads the automatic top-up and its spending limit from the balance', async () => {
        const { result } = setup(
            credits({
                Enabled: true,
                Threshold: 20,
                Quantity: 75,
                SpendingLimitEnabled: true,
                SpendingLimit: 250,
                Spent: 150,
            })
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.settings).toEqual({
            autoTopUp: { enabled: true, amount: 75, threshold: 20 },
            spendingLimit: { enabled: true, limit: 250 },
        });
        expect(result.current.spent).toBe(150);
    });

    it('defaults the top-up amount to 50 and the limit to 250 until they are set', async () => {
        const { result } = setup(credits());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.settings).toEqual({
            autoTopUp: { enabled: false, amount: 50, threshold: 20 },
            spendingLimit: { enabled: false, limit: 250 },
        });
        expect(result.current.spent).toBe(0);
    });

    it('exposes the automatic top-up status and reason', async () => {
        const { result } = setup(credits({ Enabled: true, Quantity: 50, Status: 'Failed', Reason: 'Card declined' }));

        await waitFor(() => expect(result.current.autoTopUpStatus).toBe('Failed'));
        expect(result.current.autoTopUpReason).toBe('Card declined');
    });

    it('saves the automatic top-up with its spending limit in one request, then refetches', async () => {
        const { api, result } = setup(credits());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(() => result.current.saveSettings(savedSettings));

        expect(callsTo(api, autoTopUpUrl)).toEqual([
            [
                {
                    url: autoTopUpUrl,
                    method: 'put',
                    data: { Enabled: true, Quantity: 40, SpendingLimitEnabled: true, SpendingLimit: 300 },
                    silence: true,
                },
            ],
        ]);
        expect(callsTo(api, getUrl)).toHaveLength(2);
    });

    it('rejects and keeps the balance when the save fails', async () => {
        const { api, result } = setup(credits(), [autoTopUpUrl]);
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(() => expect(result.current.saveSettings(savedSettings)).rejects.toEqual(new Error(autoTopUpUrl)));

        expect(callsTo(api, getUrl)).toHaveLength(1);
        expect(result.current.balance).toBe(15);
    });

    it('keeps the balance when the refetch after a save fails', async () => {
        const response = credits({ Enabled: true, Threshold: 20, Quantity: 75 });
        const api = jest
            .fn()
            .mockResolvedValueOnce(response)
            .mockResolvedValueOnce(response)
            .mockRejectedValueOnce(new Error('offline'));
        (useApi as jest.Mock).mockReturnValue(api);
        const { result } = renderHook(() => useLumoCredits());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(() => result.current.saveSettings(savedSettings));

        expect(api).toHaveBeenCalledTimes(3);
        expect(result.current).toMatchObject({ balance: 15, loading: false });
        expect(result.current.settings.autoTopUp).toEqual({ enabled: true, amount: 75, threshold: 20 });
    });
});
