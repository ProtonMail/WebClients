import { renderHook, waitFor } from '@testing-library/react';

import { useApi } from '@proton/app-context/useApi';

import type { UsageSummaryBreakdownRow } from '../remote/usage';
import { getLastUtcDates, getTokenUsageDays, useAllPersonalAccessTokensUsage } from './usePersonalAccessTokenUsage';

jest.mock('@proton/app-context/useApi');

const row = (overrides: Partial<UsageSummaryBreakdownRow>): UsageSummaryBreakdownRow => ({
    Date: '2026-11-01',
    TokensIn: 0,
    TokensInCached: 0,
    TokensGenerated: 0,
    ApiCalls: 0,
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

    it('requests each key over the padded days and keeps a failing key to its own card', async () => {
        jest.useFakeTimers({ now: new Date('2026-11-09T12:00:00Z') });
        const api = jest.fn(({ params }) =>
            params.PersonalAccessTokenID === 'key-a'
                ? Promise.resolve({ Code: 1000, Breakdown: [row({ Date: '2026-11-09', TokensIn: 5 })] })
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
            days: [{ Date: '2026-11-08' }, { Date: '2026-11-09' }],
        });
        expect(result.current.byId['key-b']).toMatchObject({ error: true, isLoading: false });
    });
});

describe('getTokenUsageDays', () => {
    it('counts cached tokens as input tokens', () => {
        expect(
            getTokenUsageDays(
                [row({ TokensIn: 10, TokensInCached: 5, TokensGenerated: 20, ApiCalls: 2 })],
                ['2026-11-01']
            )
        ).toEqual([{ Date: '2026-11-01', InputTokenCount: 15, OutputTokenCount: 20, TokenCount: 35, ApiCalls: 2 }]);
    });

    it('sums the models of the same day', () => {
        expect(
            getTokenUsageDays(
                [
                    row({ TokensIn: 10, TokensGenerated: 1, ApiCalls: 1 }),
                    row({ TokensIn: 30, TokensGenerated: 3, ApiCalls: 2 }),
                ],
                ['2026-11-01']
            )
        ).toEqual([{ Date: '2026-11-01', InputTokenCount: 40, OutputTokenCount: 4, TokenCount: 44, ApiCalls: 3 }]);
    });

    it('fills days without usage with zeros', () => {
        expect(getTokenUsageDays([row({ Date: '2026-11-02', TokensIn: 7 })], ['2026-11-01', '2026-11-02'])).toEqual([
            { Date: '2026-11-01', InputTokenCount: 0, OutputTokenCount: 0, TokenCount: 0, ApiCalls: 0 },
            { Date: '2026-11-02', InputTokenCount: 7, OutputTokenCount: 0, TokenCount: 7, ApiCalls: 0 },
        ]);
    });
});
