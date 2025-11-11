import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useDebounceInput from '@proton/components/components/input/useDebounceInput';
import useApi from '@proton/components/hooks/useApi';
import usePreviousDistinct from '@proton/hooks/usePreviousDistinct';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { queryMembers, searchMembers as searchMembersAPI } from '@proton/shared/lib/api/members';
import type { Member } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { useMembers } from './hooks';

interface UseMembersAdvancedParams {
    page?: number;
    pageSize?: number;
    keywords?: string;
    searchDebounceThreshold?: number;
}
interface UseMembersAdvancedInternalParams extends UseMembersAdvancedParams {
    enabled: boolean;
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

const LARGE_ORG_MEMBER_THRESHOLD = 100;
const DEFAULT_MEMBERS_RESULT = {
    data: [] as Member[],
    loading: true,
    error: null,
    total: 0,
    sync: async () => {},
    totalPages: 0,
};

/**
 * Remote mode hook for advanced members management.
 * Handles pagination and search through API calls for large organizations.
 */
const useMembersAdvancedRemote = ({
    enabled,
    page = 1,
    pageSize = 50,
    keywords,
    searchDebounceThreshold = 300,
}: UseMembersAdvancedInternalParams) => {
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

    if (!enabled) {
        return DEFAULT_MEMBERS_RESULT;
    }
    return { data: returnData, loading, error, total, sync, totalPages: Math.ceil(total / pageSize) };
};

const useMembersAdvancedLocal = ({ enabled, page = 1, pageSize = 50, keywords }: UseMembersAdvancedInternalParams) => {
    const [allMembers, membersLoading] = useMembers();
    if (!enabled || !allMembers) {
        return DEFAULT_MEMBERS_RESULT;
    }

    // Filter by keywords if provided
    let filteredMembers = allMembers;
    if (keywords) {
        const searchLower = keywords.toLowerCase();
        filteredMembers = allMembers.filter((member) => {
            const name = member.Name?.toLowerCase() || '';
            // Check if any address email matches
            const addressEmails = member.Addresses?.map((addr) => addr.Email?.toLowerCase() || '').join(' ') || '';
            return name.includes(searchLower) || addressEmails.includes(searchLower);
        });
    }

    // Paginate locally
    const total = filteredMembers.length;
    const actualPage = Math.min(page, Math.ceil(total / pageSize));
    const startIndex = pageSize * (actualPage - 1);
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredMembers.slice(startIndex, endIndex);

    return {
        data: paginatedData as Member[],
        loading: membersLoading,
        error: null,
        // No need to do anything as redux wrapper already handles the sync
        sync: noop as unknown as () => Promise<void>,
        total,
        totalPages: Math.ceil(total / pageSize),
    };
};

/**
 * Advanced members hook that's independent from Redux store, unlike the existing `useMembers` hook.
 * Provides additional features including data pagination (`page`, `pageSize`) and keywords search (`keyword` param)
 * for filtering members. Useful when you need isolated member data management without relying on global state.
 *
 * For small organizations (< 100 members), uses local mode with `useMembers` for better performance.
 * For large organizations (>= 100 members), uses remote mode with API pagination and search.
 */
const useMembersAdvanced = ({
    page = 1,
    pageSize = 50,
    keywords,
    searchDebounceThreshold = 200,
}: UseMembersAdvancedParams): UseMembersAdvancedResult => {
    const rawApi = useApi();
    const api = useMemo(() => getSilentApi(rawApi), [rawApi]);
    const [mode, setMode] = useState<'local' | 'remote' | null>(null);

    // Initialization: fetch member count and determine if we should use local mode
    useEffect(() => {
        if (mode != null) {
            return;
        }

        async function initialize() {
            try {
                const { Total } = await api<MembersResponse>(
                    queryMembers({
                        Page: 0,
                        PageSize: 1,
                    })
                );
                setMode(Total < LARGE_ORG_MEMBER_THRESHOLD ? 'local' : 'remote');
            } catch (error) {
                // If initialization fails, default to remote mode
                setMode('remote');
            }
        }
        void initialize();
    }, [mode, api]);

    // Remote mode: use the remote hook
    const remoteResult = useMembersAdvancedRemote({
        enabled: mode === 'remote',
        page,
        pageSize,
        keywords,
        searchDebounceThreshold,
    });

    // Local mode: use Redux store and handle pagination/search locally
    const localResult = useMembersAdvancedLocal({
        enabled: mode === 'local',
        page,
        pageSize,
        keywords,
    });

    if (mode == null) {
        return DEFAULT_MEMBERS_RESULT;
    }
    return mode === 'local' ? localResult : remoteResult;
};

export default useMembersAdvanced;
