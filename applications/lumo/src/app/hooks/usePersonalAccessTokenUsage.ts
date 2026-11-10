import { useEffect, useMemo, useRef, useState } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { DAY } from '@proton/shared/lib/constants';

import type { UsageSummaryBreakdownRow, UsageSummaryResponse } from '../remote/usage';
import { getUsageSummaryRequest } from '../remote/usage';

export interface TokenUsageDay {
    Date: string;
    TokenCount: number;
    InputTokenCount: number;
    OutputTokenCount: number;
    ApiCalls: number;
}

export interface TokenUsageState {
    days: TokenUsageDay[];
    totalTokenCount: number;
    totalInputTokenCount: number;
    totalOutputTokenCount: number;
    totalApiCalls: number;
    isLoading: boolean;
    error: boolean;
}

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

export const getLastUtcDates = (dayCount: number, now: Date): string[] =>
    Array.from({ length: dayCount }, (_, i) => toISODate(new Date(now.getTime() - (dayCount - 1 - i) * DAY)));

export const getTokenUsageDays = (breakdown: UsageSummaryBreakdownRow[], dates: string[]): TokenUsageDay[] =>
    dates.map((date) => {
        const rows = breakdown.filter((row) => row.Date === date);
        const inputTokenCount = rows.reduce((sum, row) => sum + row.TokensIn + row.TokensInCached, 0);
        const outputTokenCount = rows.reduce((sum, row) => sum + row.TokensGenerated, 0);
        return {
            Date: date,
            InputTokenCount: inputTokenCount,
            OutputTokenCount: outputTokenCount,
            TokenCount: inputTokenCount + outputTokenCount,
            ApiCalls: rows.reduce((sum, row) => sum + row.ApiCalls, 0),
        };
    });

const fetchPersonalAccessTokenUsage = async (
    api: ReturnType<typeof useApi>,
    tokenId: string,
    windowDays: number
): Promise<TokenUsageState> => {
    try {
        const dates = getLastUtcDates(windowDays, new Date());
        const response = await api<UsageSummaryResponse>({
            ...getUsageSummaryRequest({
                From: dates[0],
                To: dates[dates.length - 1],
                PersonalAccessTokenID: tokenId,
            }),
            silence: true,
        });

        const paddedDays = getTokenUsageDays(response.Breakdown, dates);
        const totalTokenCount = paddedDays.reduce((sum, day) => sum + day.TokenCount, 0);
        const totalInputTokenCount = paddedDays.reduce((sum, day) => sum + day.InputTokenCount, 0);
        const totalOutputTokenCount = paddedDays.reduce((sum, day) => sum + day.OutputTokenCount, 0);
        const totalApiCalls = paddedDays.reduce((sum, day) => sum + day.ApiCalls, 0);
        return {
            days: paddedDays,
            totalTokenCount,
            totalInputTokenCount,
            totalOutputTokenCount,
            totalApiCalls,
            isLoading: false,
            error: false,
        };
    } catch {
        return {
            days: [],
            totalTokenCount: 0,
            totalInputTokenCount: 0,
            totalOutputTokenCount: 0,
            totalApiCalls: 0,
            isLoading: false,
            error: true,
        };
    }
};

/**
 * Fetches usage for every token ID in one parallel batch (one request per key).
 */
export const useAllPersonalAccessTokensUsage = (tokenIds: string[], windowDays = 30) => {
    const api = useApi();
    const apiRef = useRef(api);
    apiRef.current = api;

    const [state, setState] = useState<{
        byId: Record<string, TokenUsageState>;
        isLoading: boolean;
        error: boolean;
    }>({ byId: {}, isLoading: true, error: false });

    const idsKey = useMemo(() => [...tokenIds].sort().join(','), [tokenIds]);

    useEffect(() => {
        if (tokenIds.length === 0) {
            setState({ byId: {}, isLoading: false, error: false });
            return;
        }

        let ignore = false;
        setState((s) => ({ ...s, isLoading: true, error: false }));

        void Promise.all(
            tokenIds.map(async (id) => {
                const u = await fetchPersonalAccessTokenUsage(apiRef.current, id, windowDays);
                return { id, u };
            })
        ).then((pairs) => {
            if (ignore) {
                return;
            }
            const byId: Record<string, TokenUsageState> = {};
            for (const { id, u } of pairs) {
                byId[id] = u;
            }
            setState({ byId, isLoading: false, error: pairs.some((p) => p.u.error) });
        });

        return () => {
            ignore = true;
        };
    }, [idsKey, windowDays, tokenIds.length]);

    return state;
};

export const getLoadingUsageState = (): TokenUsageState => ({
    days: [],
    totalTokenCount: 0,
    totalInputTokenCount: 0,
    totalOutputTokenCount: 0,
    totalApiCalls: 0,
    isLoading: true,
    error: false,
});
