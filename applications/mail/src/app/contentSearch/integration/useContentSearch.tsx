import { useEffect, useRef } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import type { IndexingMetrics } from '@proton/encrypted-search/esHelpers';
import type { ESCallbacks, EncryptedSearchFunctions, NormalizedSearchParams } from '@proton/encrypted-search/models';

import { isSearch } from '../../helpers/elements';
import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';
import { selectSearch } from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';

import { getSharedIndexService } from '../indexation/IndexService';
import { SearchService } from '../search/SearchService';
import { ESAdapter } from './ESAdapter';

type Functions = EncryptedSearchFunctions<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;

interface Props {
    refreshMask: number;
    esCallbacks: ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;
    contentIndexingSuccessMessage?: string;
    onMetadataIndexed?: (metrics: IndexingMetrics) => void;
    /**
     * The legacy `useEncryptedSearch` instance. While the v2 content-search index has no event
     * syncing of its own, we keep the legacy ES index up to date by forwarding events to it.
     */
    esLibraryFunctionsV1: Functions;
}

/**
 * The provider spreads the returned functions into the context value, and consumers destructure and
 * call them detached (e.g. `const { encryptedSearch } = useEncryptedSearchContext()`). Both require
 * own, `this`-bound properties, so we expose the {@link ESAdapter} (whose methods live on the
 * prototype) as a plain object literal of instance-bound methods.
 */
const toBoundFunctions = (adapter: ESAdapter): Functions => ({
    encryptedSearch: adapter.encryptedSearch.bind(adapter),
    cacheIndexedDB: adapter.cacheIndexedDB.bind(adapter),
    handleEvent: adapter.handleEvent.bind(adapter),
    shouldHighlight: adapter.shouldHighlight.bind(adapter),
    highlightString: adapter.highlightString.bind(adapter),
    highlightMetadata: adapter.highlightMetadata.bind(adapter),
    enableEncryptedSearch: adapter.enableEncryptedSearch.bind(adapter),
    enableContentSearch: adapter.enableContentSearch.bind(adapter),
    isSearchResult: adapter.isSearchResult.bind(adapter),
    esDelete: adapter.esDelete.bind(adapter),
    initializeES: adapter.initializeES.bind(adapter),
    pauseContentIndexing: adapter.pauseContentIndexing.bind(adapter),
    pauseMetadataIndexing: adapter.pauseMetadataIndexing.bind(adapter),
    correctDecryptionErrors: adapter.correctDecryptionErrors.bind(adapter),
    toggleEncryptedSearch: adapter.toggleEncryptedSearch.bind(adapter),
    getCache: adapter.getCache.bind(adapter),
    resetCache: adapter.resetCache.bind(adapter),
    esStatus: adapter.esStatus,
    progressRecorderRef: adapter.progressRecorderRef,
    esIndexingProgressState: adapter.esIndexingProgressState,
});

/**
 * Content-search counterpart of {@link useEncryptedSearch}. It exposes the same
 * {@link EncryptedSearchFunctions} surface — implemented, hook-free, in {@link ESAdapter} — so it can
 * be swapped in behind the `ContentSearch` feature flag. This hook only owns the adapter's lifecycle:
 * it keeps a single stable instance (its bound surface) and refreshes the per-render dependencies on it.
 */
export const useContentSearch = ({ esCallbacks, esLibraryFunctionsV1 }: Props): Functions => {
    const [user] = useUser();
    const getUserKeys = useGetUserKeys();

    // A ref, not useMemo: the adapter owns imperative state that must survive every render — the
    // lazily cold-started search worker and the current search state (see ESAdapter.searchService/lastSearch).
    // useMemo is only a hint (React may drop and recompute it), which would silently re-cold-start
    // the worker and lose the cache. The ref also lets us keep a single stable instance while the
    // per-render deps (esCallbacks/esLibraryFunctionsV1, which change most renders) are refreshed
    // onto it below — rather than recreating it, which is what encoding them as memo deps would do.
    // It only depends on the userID which doesn't change within the lifetime of the app.
    const ref = useRef<{ adapter: ESAdapter; functions: Functions }>();
    if (!ref.current) {
        const searchService = new SearchService(user.ID, getUserKeys);
        const indexService = getSharedIndexService(user.ID, getUserKeys);
        const adapter = new ESAdapter(searchService, indexService, esCallbacks, esLibraryFunctionsV1);
        ref.current = { adapter, functions: toBoundFunctions(adapter) };
    }

    const search = useMailSelector(selectSearch);
    const isSearching = isSearch(search);

    useEffect(() => {
        if (!isSearching) {
            ref.current?.adapter.leaveSearch();
        }
    }, [isSearching]);

    // Refresh the per-render dependencies on the (stable) adapter so its bound methods never read
    // stale values — esLibraryFunctionsV1's identity changes when V1's esStatus does.
    ref.current.adapter.esCallbacks = esCallbacks;
    ref.current.adapter.esLibraryFunctionsV1 = esLibraryFunctionsV1;

    return ref.current.functions;
};
