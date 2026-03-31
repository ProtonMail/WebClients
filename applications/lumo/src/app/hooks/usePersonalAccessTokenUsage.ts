import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useApi } from '@proton/components/index';

import type { PersonalAccessTokenUsageDay } from '../remote/personalAccessToken';
import { getPersonalAccessTokenUsageRequest } from '../remote/personalAccessToken';

export interface TokenUsageState {
    days: PersonalAccessTokenUsageDay[];
    totalTokenCount: number;
    totalApiCalls: number;
    isLoading: boolean;
    error: boolean;
}

const EMPTY_STATE: TokenUsageState = {
    days: [],
    totalTokenCount: 0,
    totalApiCalls: 0,
    isLoading: true,
    error: false,
};

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Fetches usage for one PAT (shared by the per-token hook and aggregate overview).
 */
export const fetchPersonalAccessTokenUsage = async (
    api: ReturnType<typeof useApi>,
    tokenId: string,
    windowDays: number
): Promise<TokenUsageState> => {
    try {
        const to = new Date();
        const from = new Date(to);
        from.setDate(from.getDate() - (windowDays - 1));

        const response = await api<{ Code: number; Usage: PersonalAccessTokenUsageDay[] }>(
            getPersonalAccessTokenUsageRequest(tokenId, {
                from: toISODate(from),
                to: toISODate(to),
            })
        );

        const rawDays = response.Usage ?? [];
        const dateMap = new Map(rawDays.map((d) => [d.Date, d]));
        const paddedDays: PersonalAccessTokenUsageDay[] = Array.from({ length: windowDays }, (_, i) => {
            const d = new Date(from);
            d.setDate(from.getDate() + i);
            const dateStr = toISODate(d);
            return dateMap.get(dateStr) ?? { Date: dateStr, TokenCount: 0, ApiCalls: 0 };
        });
        const totalTokenCount = paddedDays.reduce((sum, day) => sum + day.TokenCount, 0);
        const totalApiCalls = paddedDays.reduce((sum, day) => sum + (day.ApiCalls ?? 0), 0);
        return {
            days: paddedDays,
            totalTokenCount,
            totalApiCalls,
            isLoading: false,
            error: false,
        };
    } catch {
        return { days: [], totalTokenCount: 0, totalApiCalls: 0, isLoading: false, error: true };
    }
};

/**
 * Fetches usage for every token ID in one parallel batch (one request per key).
 * Powers the overview totals and per-key cards without duplicate fetches.
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
            if (pairs.some((p) => p.u.error)) {
                setState({ byId: {}, isLoading: false, error: true });
                return;
            }
            const byId: Record<string, TokenUsageState> = {};
            for (const { id, u } of pairs) {
                byId[id] = u;
            }
            setState({ byId, isLoading: false, error: false });
        });

        return () => {
            ignore = true;
        };
    }, [idsKey, windowDays, tokenIds.length]);

    const aggregate = useMemo(() => {
        const list = Object.values(state.byId);
        const totalTokens = list.reduce((s, u) => s + u.totalTokenCount, 0);
        const totalApiCalls = list.reduce((s, u) => s + u.totalApiCalls, 0);
        return { totalTokens, totalApiCalls };
    }, [state.byId]);

    return { ...state, aggregate };
};

export const getLoadingUsageState = (): TokenUsageState => ({
    days: [],
    totalTokenCount: 0,
    totalApiCalls: 0,
    isLoading: true,
    error: false,
});

/**
 * Fetches LLM token usage for a single Personal Access Token over the given
 * window (default 30 days). Returns per-day counts and totals.
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
        const result = await fetchPersonalAccessTokenUsage(apiRef.current, tokenId, windowDays);
        onDone(result);
    }, [tokenId, windowDays]);

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
