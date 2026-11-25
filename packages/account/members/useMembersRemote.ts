import { useCallback, useEffect, useRef } from 'react';

import type { SerializedError } from '@reduxjs/toolkit';

import useDebounceInput from '@proton/hooks/useDebounceInput';
import type { EnhancedMember } from '@proton/shared/lib/interfaces/Member';

import { useDispatch, useSelector, useStore } from '../store/hooks';
import type { MembersState } from './index';
import { type MembersPageState, fetchMembersPage, selectMembersPage, selectMembersPageRows } from './membersPage';

interface UseMembersAdvancedParams {
    page?: number;
    pageSize?: number;
    keywords?: string;
    searchDebounceThreshold?: number;
}

interface UseMembersAdvancedResult {
    data: EnhancedMember[];
    loading: boolean;
    error: SerializedError | undefined;
    total: number;
    sync: () => Promise<void>;
    totalPages: number;
}

/**
 * Remote mode hook for advanced members management.
 * Handles pagination and search through API calls for large organizations.
 * The members are kept in the store, so that members saved elsewhere (an edit, an event) also update the page.
 */
export const useMembersRemote = ({
    page = 1,
    pageSize = 50,
    keywords,
    searchDebounceThreshold = 300,
}: UseMembersAdvancedParams): UseMembersAdvancedResult => {
    const dispatch = useDispatch();
    // Debounce keywords to avoid excessive API calls while typing
    const debouncedKeywords = useDebounceInput(keywords, searchDebounceThreshold);
    const data = useSelector((state: MembersPageState & MembersState) => selectMembersPageRows(state, page, pageSize));
    const store = useStore();
    const { total, loading, error, stale } = useSelector(selectMembersPage);
    const requestRef = useRef<{ abort: () => void }>(undefined);

    // Aborts the previous request when called again, and when the component unmounts
    const sync = useCallback(
        async (refetch = true) => {
            requestRef.current?.abort();
            // TODO: handle the moreToDisplay scenario and show a hint to the user
            const request = dispatch(fetchMembersPage({ page, pageSize, keywords: debouncedKeywords, refetch }));
            requestRef.current = request;
            await request;
        },
        [dispatch, page, pageSize, debouncedKeywords]
    );

    useEffect(() => {
        void sync(false);
        return () => {
            requestRef.current?.abort();
        };
    }, [sync]);

    // The members list reloaded after the page was fetched. Reads the store rather than `stale`, because the
    // effect above may have already started a request in this commit, which clears the flag.
    useEffect(() => {
        if (stale && selectMembersPage(store.getState()).stale) {
            void sync();
        }
    }, [stale, sync, store]);

    return { data, loading, error, total, sync, totalPages: Math.ceil(total / pageSize) };
};
