import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useDebounceInput from '@proton/components/components/input/useDebounceInput';
import useApi from '@proton/components/hooks/useApi';
import usePreviousDistinct from '@proton/hooks/usePreviousDistinct';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { queryMembers, searchMembers as searchMembersAPI } from '@proton/shared/lib/api/members';
import type { Member } from '@proton/shared/lib/interfaces';

interface UseMembersAdvancedParams {
    page?: number;
    pageSize?: number;
    keywords?: string;
    searchDebounceThreshold?: number;
}

interface UseMembersAdvancedResult {
    data: Member[];
    loading: boolean;
    error: Error | null;
    total: number;
    sync: () => Promise<void>;
    totalPages: number;
}

interface MembersResponse {
    Members: Member[];
    Total: number;
    More?: boolean;
}

/**
 * Remote mode hook for advanced members management.
 * Handles pagination and search through API calls for large organizations.
 */
export const useMembersRemote = ({
    page = 1,
    pageSize = 50,
    keywords,
    searchDebounceThreshold = 300,
}: UseMembersAdvancedParams): UseMembersAdvancedResult => {
    const rawApi = useApi();
    const api = useMemo(() => getSilentApi(rawApi), [rawApi]);
    const [buffer, setBuffer] = useState<Member[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const abortControllerRef = useRef(new AbortController());

    // Debounce keywords to avoid excessive API calls while typing
    const debouncedKeywords = useDebounceInput(keywords, searchDebounceThreshold);
    // Debounce keywords to avoid excessive filtering while typing
    const prevKeywords = usePreviousDistinct(debouncedKeywords);

    const searchMembers = useCallback(
        (signal: AbortSignal) => api<MembersResponse>({ ...searchMembersAPI(debouncedKeywords), signal }),
        [api, debouncedKeywords]
    );

    const fetchMembers = useCallback(
        (signal: AbortSignal) =>
            api<MembersResponse>({
                ...queryMembers({
                    Page: page - 1,
                    PageSize: pageSize,
                }),
                signal,
            }),
        [api, page, pageSize]
    );

    const returnData = useMemo(() => {
        const actualPage = Math.min(page, Math.ceil(buffer.length / pageSize));
        // If debounce keywords is set, means we are in search mode, use buffer + slice to simulate the pagination
        // otherwise we can use the buffer directly, which will be the paginated results from the API
        return debouncedKeywords ? buffer.slice(pageSize * (actualPage - 1), pageSize * actualPage) : buffer;
    }, [buffer, page, pageSize, debouncedKeywords]);

    // Sync members with API base on debounced keywords or page change,
    // use different fetchers for different cases to avoid unnecessary API calls.
    // Aborts the previous request when called again to avoid race conditions and overriding with stale data.
    const sync = useCallback(
        async (forced = true) => {
            // if search params haven't changed and it's not a force sync, skip fetching and use the cached data from buffer
            if (debouncedKeywords && debouncedKeywords === prevKeywords && !forced) {
                return;
            }

            abortControllerRef.current.abort();
            abortControllerRef.current = new AbortController();
            const { signal } = abortControllerRef.current;

            setLoading(true);
            const fetcher = debouncedKeywords ? searchMembers : fetchMembers;
            try {
                const { Members, Total, More } = await fetcher(signal);
                // There's an implementation restriction in the API, the Total field is not always accurate for searchMembers when the result is too large,
                // as a workaround there'll be an extra boolean field `More` to indicate that we should use actual members length instead of Total.
                const correctTotal = fetcher === fetchMembers || More ? Total : Members.length;
                setTotal(correctTotal);
                // TODO: handle the moreToDisplay scenario and show a hint to the user
                setBuffer(Members);
                setLoading(false);
            } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    setError(err);
                    setLoading(false);
                }
            }
        },
        [fetchMembers, searchMembers, debouncedKeywords, prevKeywords]
    );

    // Auto sync when dependencies change; abort in-flight request on cleanup
    useEffect(() => {
        void sync(false);
        return () => {
            abortControllerRef.current.abort();
        };
    }, [sync]);

    return { data: returnData, loading, error, total, sync, totalPages: Math.ceil(total / pageSize) };
};
