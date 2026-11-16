import { renderHook, waitFor } from '@testing-library/react';

import { useApi } from '@proton/app-context/useApi';

import type { UsageEntry } from '../remote/usage';
import { getLastUtcDates, getTokenUsageDays, useAllPersonalAccessTokensUsage } from './usePersonalAccessTokenUsage';

jest.mock('@proton/app-context/useApi');

const entry = (overrides: Partial<UsageEntry>): UsageEntry => ({
    ClientType: 'api',
    Model: 'lumo-lite',
    InputTokens: 0,
    OutputTokens: 0,
    Calls: 0,
    CostMicros: 0,
    ...overrides,
});

describe('getLastUtcDates', () => {
    it('ends on the UTC day, not the local one', () => {
        expect(getLastUtcDates(3, new Date('2026-11-09T23:30:00Z'))).toEqual([
            '2026-11-07',
            '2026-11-08',
            '2026-11-09',
        ]);
    });

    it('gives one date per day across a daylight saving change', () => {
        const dates = getLastUtcDates(30, new Date('2026-11-10T00:30:00Z'));

        expect(new Set(dates).size).toBe(30);
        expect(dates[0]).toBe('2026-10-12');
        expect(dates).toContain('2026-10-25');
    });
});

describe('useAllPersonalAccessTokensUsage', () => {
    const tokenIds = ['key-a', 'key-b'];

    afterEach(() => {
        jest.useRealTimers();
    });

    it('requests each key over the last days and keeps a failing key to its own card', async () => {
        jest.useFakeTimers({ now: new Date('2026-11-09T12:00:00Z') });
        const days = [
            { Date: '2026-11-08', Usage: [] },
            { Date: '2026-11-09', Usage: [entry({ InputTokens: 5, OutputTokens: 2, Calls: 3 })] },
        ];
        const api = jest.fn(({ params }) =>
            params.PersonalAccessTokenID === 'key-a'
                ? Promise.resolve({ Code: 1000, Days: days })
                : Promise.reject(new Error('404'))
        );
        (useApi as jest.Mock).mockReturnValue(api);

        const { result } = renderHook(() => useAllPersonalAccessTokensUsage(tokenIds, 2));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(api).toHaveBeenCalledWith({
            url: 'ai/v1/usage/summary',
            method: 'get',
            params: { From: '2026-11-08', To: '2026-11-09', PersonalAccessTokenID: 'key-a' },
            silence: true,
        });
        expect(api).toHaveBeenCalledWith(
            expect.objectContaining({ params: expect.objectContaining({ PersonalAccessTokenID: 'key-b' }) })
        );
        expect(result.current.byId['key-a']).toMatchObject({
            error: false,
            totalInputTokenCount: 5,
            totalOutputTokenCount: 2,
            totalTokenCount: 7,
            totalApiCalls: 3,
            days: [{ Date: '2026-11-08' }, { Date: '2026-11-09' }],
        });
        expect(result.current.byId['key-b']).toMatchObject({ error: true, isLoading: false });
    });
});

describe('getTokenUsageDays', () => {
    it('sums the models of the same day', () => {
        expect(
            getTokenUsageDays([
                {
                    Date: '2026-11-01',
                    Usage: [
                        entry({ InputTokens: 10, OutputTokens: 1, Calls: 1 }),
                        entry({ Model: 'lumo-max', InputTokens: 30, OutputTokens: 3, Calls: 2 }),
                    ],
                },
            ])
        ).toEqual([{ Date: '2026-11-01', InputTokenCount: 40, OutputTokenCount: 4, TokenCount: 44, ApiCalls: 3 }]);
    });

    it('keeps each day’s usage on its own day, with zeros for a day without usage', () => {
        expect(
            getTokenUsageDays([
                { Date: '2026-11-01', Usage: [] },
                { Date: '2026-11-02', Usage: [entry({ InputTokens: 7 })] },
            ])
        ).toEqual([
            { Date: '2026-11-01', InputTokenCount: 0, OutputTokenCount: 0, TokenCount: 0, ApiCalls: 0 },
            { Date: '2026-11-02', InputTokenCount: 7, OutputTokenCount: 0, TokenCount: 7, ApiCalls: 0 },
        ]);
    });
});
