import { renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useApi } from '@proton/app-context/useApi';

import type { UsageScope } from '../../remote/usage';
import { useApiUsageSummary } from './useApiUsageSummary';

vi.mock('@proton/app-context/useApi');

describe('useApiUsageSummary', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('reads the usage of every client of the last 90 UTC days in the given scope without notifying on failure', async () => {
        vi.useFakeTimers({ now: new Date('2026-11-09T23:30:00Z'), toFake: ['Date'] });
        const entry = {
            ClientType: 'api',
            Model: 'lumo-lite',
            InputTokens: 3,
            OutputTokens: 1,
            Calls: 1,
            CostMicros: 10,
        };
        const chatEntry = { ...entry, ClientType: 'frontend' };
        const api = vi.fn().mockResolvedValue({
            Code: 1000,
            ClientTypes: [
                { ClientType: 'api', Billed: true },
                { ClientType: 'frontend', Billed: false },
            ],
            Days: [{ Date: '2026-11-09', Usage: [entry, chatEntry] }],
        });
        (useApi as Mock).mockReturnValue(api);

        const { result } = renderHook(() => useApiUsageSummary('organization'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(api).toHaveBeenCalledWith({
            url: 'ai/v1/usage/summary',
            method: 'get',
            params: { From: '2026-08-12', To: '2026-11-09', Scope: 'organization' },
            silence: true,
        });
        expect(result.current).toMatchObject({
            rows: [
                { ...entry, Date: '2026-11-09' },
                { ...chatEntry, Date: '2026-11-09', CostMicros: 0 },
            ],
            error: false,
        });
        expect(result.current.dates).toHaveLength(90);
    });

    it('reports an error when the summary cannot be read', async () => {
        (useApi as Mock).mockReturnValue(vi.fn().mockRejectedValue(new Error('503')));

        const { result } = renderHook(() => useApiUsageSummary('self'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current).toMatchObject({ rows: [], error: true });
    });

    it('drops the previous scope’s usage while the new scope loads', async () => {
        const selfDays = [{ Date: '2026-11-09', Usage: [{ ClientType: 'api', Model: 'lumo-lite' }] }];
        const api = vi
            .fn()
            .mockResolvedValueOnce({ Code: 1000, ClientTypes: [{ ClientType: 'api', Billed: true }], Days: selfDays })
            .mockReturnValueOnce(new Promise(() => {}));
        (useApi as Mock).mockReturnValue(api);
        const { result, rerender } = renderHook(({ scope }) => useApiUsageSummary(scope), {
            initialProps: { scope: 'self' as UsageScope },
        });
        await waitFor(() => expect(result.current.rows).toHaveLength(1));

        rerender({ scope: 'organization' });

        expect(result.current).toMatchObject({ rows: [], isLoading: true });
    });
});
