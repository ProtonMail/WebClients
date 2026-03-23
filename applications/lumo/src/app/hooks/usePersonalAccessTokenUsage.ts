import { useCallback, useEffect, useRef, useState } from 'react';

import { useApi } from '@proton/components/index';

import type { PersonalAccessTokenUsageDay } from '../remote/personalAccessToken';
import { getPersonalAccessTokenUsageRequest } from '../remote/personalAccessToken';

export interface TokenUsageState {
    days: PersonalAccessTokenUsageDay[];
    totalTokenCount: number;
    isLoading: boolean;
    error: boolean;
}

const EMPTY_STATE: TokenUsageState = {
    days: [],
    totalTokenCount: 0,
    isLoading: true,
    error: false,
};

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Fetches LLM token usage for a single Personal Access Token over the given
 * window (default 30 days). Returns per-day counts and a running total.
 */
export const usePersonalAccessTokenUsage = (
    tokenId: string,
    windowDays = 30
): TokenUsageState => {
    const api = useApi();
    const apiRef = useRef(api);
    apiRef.current = api;

    const [state, setState] = useState<TokenUsageState>(EMPTY_STATE);

    const load = useCallback(async (onDone: (result: TokenUsageState) => void) => {
        try {
            const to = new Date();
            const from = new Date(to);
            from.setDate(from.getDate() - (windowDays - 1));

            const response = await apiRef.current<{ Code: number; Usage: PersonalAccessTokenUsageDay[] }>(
                getPersonalAccessTokenUsageRequest(tokenId, {
                    from: toISODate(from),
                    to: toISODate(to),
                })
            );

            const rawDays = response.Usage ?? [];
            // The API only returns days with actual usage; pad the full window with zeros
            // so the chart always renders exactly windowDays bars, rightmost = today.
            const dateMap = new Map(rawDays.map((d) => [d.Date, d]));
            const paddedDays: PersonalAccessTokenUsageDay[] = Array.from({ length: windowDays }, (_, i) => {
                const d = new Date(from);
                d.setDate(from.getDate() + i);
                const dateStr = toISODate(d);
                return dateMap.get(dateStr) ?? { Date: dateStr, TokenCount: 0, ApiCalls: 0 };
            });
            onDone({
                days: paddedDays,
                totalTokenCount: paddedDays.reduce((sum, day) => sum + day.TokenCount, 0),
                isLoading: false,
                error: false,
            });
        } catch {
            onDone({ days: [], totalTokenCount: 0, isLoading: false, error: true });
        }
    }, [tokenId, windowDays]); // api accessed via ref to avoid re-firing on every render

    // React.StrictMode double-invokes effects in development. The ignore flag
    // ensures the first (simulated) unmount discards its result so only the second
    // (real) mount's response updates state.
    useEffect(() => {
        let ignore = false;
        setState(EMPTY_STATE);
        void load((result) => {
            if (!ignore) setState(result);
        });
        return () => {
            ignore = true;
        };
    }, [load]);

    return state;
};
