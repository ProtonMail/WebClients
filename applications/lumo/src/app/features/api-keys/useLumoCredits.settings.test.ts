import { act, renderHook, waitFor } from '@testing-library/react';

import { useApi } from '@proton/app-context/useApi';
import type { LumoCreditResponse } from '@proton/payments/core/api/lumoCredit';
import { MOCK_LUMO_CREDIT_RESPONSE } from '@proton/payments/testing/lumo-credit';

import { useLumoCredits } from './useLumoCredits';

jest.mock('@proton/app-context/useApi');

const getUrl = 'payments/v5/products/lumo-credit';
const autoTopUpUrl = 'payments/v5/products/lumo-credit/auto-top-up';
const spendingLimitUrl = 'payments/v5/products/lumo-credit/spending-limit';

const credits = (overrides: Partial<LumoCreditResponse> = {}): LumoCreditResponse => ({
    ...MOCK_LUMO_CREDIT_RESPONSE,
    ...overrides,
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
    it('reads the automatic top-up and the spending limit from the balance', async () => {
        const { result } = setup(
            credits({
                Usage: '147.5000000000',
                UsageLimit: '250.0000000000',
                AutoTopUp: { Enabled: true, Threshold: 20, Quantity: 75 },
            })
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.settings).toEqual({
            autoTopUp: { enabled: true, amount: 75, threshold: 20 },
            spendingLimit: { enabled: true, limit: 250 },
        });
        expect(result.current).toMatchObject({ usage: 147.5, usageLimit: 250 });
    });

    it('defaults the top-up amount to 50 and treats a zero limit as no limit', async () => {
        const { result } = setup(
            credits({ UsageLimit: '0', AutoTopUp: { Enabled: false, Threshold: 20, Quantity: null } })
        );

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.settings).toEqual({
            autoTopUp: { enabled: false, amount: 50, threshold: 20 },
            spendingLimit: { enabled: false, limit: 250 },
        });
        expect(result.current.usageLimit).toBe(0);
    });

    it('exposes the automatic top-up status and reason', async () => {
        const { result } = setup(
            credits({
                AutoTopUp: { Enabled: true, Threshold: 20, Quantity: 50, Status: 'Failed', Reason: 'Card declined' },
            })
        );

        await waitFor(() => expect(result.current.autoTopUpStatus).toBe('Failed'));
        expect(result.current.autoTopUpReason).toBe('Card declined');
    });

    it('saves the automatic top-up it is given, then refetches', async () => {
        const { api, result } = setup(credits());
        await waitFor(() => expect(result.current.loading).toBe(false));

        let failedSections: unknown[] = [];
        await act(async () => {
            failedSections = await result.current.saveSettings({ autoTopUp: savedSettings.autoTopUp });
        });

        expect(failedSections).toEqual([]);
        expect(callsTo(api, autoTopUpUrl)).toEqual([
            [{ url: autoTopUpUrl, method: 'put', data: { Enabled: true, Quantity: 40 }, silence: true }],
        ]);
        expect(callsTo(api, spendingLimitUrl)).toHaveLength(0);
        expect(callsTo(api, getUrl)).toHaveLength(2);
    });

    it('saves the spending limit it is given', async () => {
        const { api, result } = setup(credits());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(() => result.current.saveSettings({ spendingLimit: savedSettings.spendingLimit }));

        expect(callsTo(api, autoTopUpUrl)).toHaveLength(0);
        expect(callsTo(api, spendingLimitUrl)).toEqual([
            [{ url: spendingLimitUrl, method: 'put', data: { Enabled: true, Limit: 300 }, silence: true }],
        ]);
    });

    it('sends nothing and does not refetch without changes', async () => {
        const { api, result } = setup(credits());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(() => result.current.saveSettings({}));

        expect(api).toHaveBeenCalledTimes(1);
    });

    it('names the section that failed when the other one saved', async () => {
        const { api, result } = setup(credits({ UsageLimit: '0' }), [spendingLimitUrl]);
        await waitFor(() => expect(result.current.loading).toBe(false));

        let failedSections: unknown[] = [];
        await act(async () => {
            failedSections = await result.current.saveSettings(savedSettings);
        });

        expect(failedSections).toEqual([{ section: 'spendingLimit', error: new Error(spendingLimitUrl) }]);
        expect(callsTo(api, autoTopUpUrl)).toHaveLength(1);
        expect(callsTo(api, getUrl)).toHaveLength(2);
    });

    it('names both sections and keeps the balance when every save fails', async () => {
        const { api, result } = setup(credits({ UsageLimit: '0' }), [autoTopUpUrl, spendingLimitUrl]);
        await waitFor(() => expect(result.current.loading).toBe(false));

        let failedSections: unknown[] = [];
        await act(async () => {
            failedSections = await result.current.saveSettings(savedSettings);
        });

        expect(failedSections).toEqual([
            { section: 'autoTopUp', error: new Error(autoTopUpUrl) },
            { section: 'spendingLimit', error: new Error(spendingLimitUrl) },
        ]);
        expect(callsTo(api, getUrl)).toHaveLength(1);
    });

    it('keeps the balance when the refetch after a save fails', async () => {
        const response = credits({ AutoTopUp: { Enabled: true, Threshold: 20, Quantity: 75 } });
        const api = jest
            .fn()
            .mockResolvedValueOnce(response)
            .mockResolvedValueOnce(response)
            .mockRejectedValueOnce(new Error('offline'));
        (useApi as jest.Mock).mockReturnValue(api);
        const { result } = renderHook(() => useLumoCredits());
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(() => result.current.saveSettings({ autoTopUp: savedSettings.autoTopUp }));

        expect(api).toHaveBeenCalledTimes(3);
        expect(result.current).toMatchObject({ balance: 15, loading: false });
        expect(result.current.settings.autoTopUp).toEqual({ enabled: true, amount: 75, threshold: 20 });
    });
});
