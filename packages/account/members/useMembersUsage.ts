import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import type { MemberUsageColumnDisplay, MembersUsageResponse, UsageByMemberID } from '@proton/shared/lib/api/members';
import { queryMembersUsage } from '@proton/shared/lib/api/members';

export interface UseMembersUsageResult {
    loading: boolean;
    error: Error | null;
    columnDisplay: MemberUsageColumnDisplay | undefined;
    usageByMemberID: UsageByMemberID;
    refetch: () => void;
}

// A stable reference so consumers can memoize on `usageByMemberID` while there's no data yet.
const EMPTY_USAGE: UsageByMemberID = {};

interface FetchState {
    loading: boolean;
    error: Error | null;
    result: MembersUsageResponse | undefined;
}

type FetchAction =
    | { type: 'fetching' }
    | { type: 'success'; result: MembersUsageResponse }
    | { type: 'failure'; error: Error }
    | { type: 'reset' };

// The idle/loading/error/data states as one machine: `fetching` keeps any current data visible while
// reloading, `success`/`failure` land the terminal state, `reset` clears everything (disabled/no members).
const fetchReducer = (state: FetchState, action: FetchAction): FetchState => {
    switch (action.type) {
        case 'fetching':
            return { ...state, loading: true, error: null };
        case 'success':
            return { loading: false, error: null, result: action.result };
        case 'failure':
            return { ...state, loading: false, error: action.error };
        case 'reset':
            // Keep the same reference when there is nothing to clear, so we don't re-render for nothing.
            if (!state.loading && state.error === null && state.result === undefined) {
                return state;
            }
            return { loading: false, error: null, result: undefined };
        default:
            return state;
    }
};

const initFetchState = (loading: boolean): FetchState => ({ loading, error: null, result: undefined });

/**
 * Fetches the "Last activity" / "Last connection" usage for a set of members (VPN B2B).
 * Refetches when the set of member IDs changes and aborts the previous request, so a stale response
 * can never overwrite fresher data. Mirrors the fetch/abort pattern of useMembersRemote.
 *
 * Use the `enabled` flag rather than passing an empty array literal to switch the fetching off, so every
 * dependency of the fetch effect stays stable.
 */
export const useMembersUsage = (memberIDs: string[], enabled: boolean = true): UseMembersUsageResult => {
    const api = useSilentApi();

    const [state, dispatch] = useReducer(fetchReducer, enabled && memberIDs.length > 0, initFetchState);
    const [refetchIndex, setRefetchIndex] = useState(0);

    const refetch = useCallback(() => setRefetchIndex((index) => index + 1), []);

    // Callers derive `memberIDs` from `members`, so the array identity changes whenever any member is edited
    // (name, role, addresses, ...) even though the set of IDs is untouched. Keying the effect on the sorted IDs
    // means we only refetch when a member is actually created or deleted. The `memberIDs` the effect closes over
    // is intentionally not a dependency: whenever the key changes the effect re-runs with that render's array,
    // and while the key is unchanged the array it captured holds the very same IDs.
    const memberIDsKey = useMemo(() => [...memberIDs].sort().join(','), [memberIDs]);

    useEffect(() => {
        if (!enabled || !memberIDs.length) {
            dispatch({ type: 'reset' });
            return;
        }

        const controller = new AbortController();

        dispatch({ type: 'fetching' });

        api<MembersUsageResponse>({ ...queryMembersUsage(memberIDs), signal: controller.signal })
            .then((response) => {
                dispatch({ type: 'success', result: response });
            })
            .catch((err: unknown) => {
                if (err instanceof Error && err.name !== 'AbortError') {
                    dispatch({ type: 'failure', error: err });
                }
            });

        return () => {
            controller.abort();
        };
    }, [memberIDsKey, enabled, api, refetchIndex]);

    return {
        loading: state.loading,
        error: state.error,
        columnDisplay: state.result?.ColumnDisplay,
        usageByMemberID: state.result?.UsageByMemberID ?? EMPTY_USAGE,
        refetch,
    };
};
