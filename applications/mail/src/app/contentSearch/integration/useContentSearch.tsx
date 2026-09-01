import { useEffect, useMemo, useRef, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { defaultESIndexingState, defaultESStatus } from '@proton/encrypted-search/constants';
import type { IndexingMetrics } from '@proton/encrypted-search/esHelpers';
import type {
    ESCallbacks,
    ESIndexingState,
    ESTimepoint,
    EncryptedSearchFunctions,
    NormalizedSearchParams,
} from '@proton/encrypted-search/models';

import { isSearch } from '../../helpers/elements';
import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';
import { esSearching, selectSearch } from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';
import { getSharedIndexService } from '../indexation/IndexService';
import { SearchService } from '../search/SearchService';
import { ESAdapter, type ESStatusConcrete } from './ESAdapter';

export type FunctionsV1 = EncryptedSearchFunctions<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;
// The reactive surface (esStatus/esIndexingProgressState/progressRecorderRef) is owned by the hook,
// not the adapter, so the hook can rebuild the functions object when it changes — mirroring V1.
export type FunctionsV2 = Omit<FunctionsV1, 'esStatus' | 'esIndexingProgressState' | 'progressRecorderRef'>;

interface Props {
    refreshMask: number;
    esCallbacks: ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;
    onMetadataIndexed?: (metrics: IndexingMetrics) => void;
    /**
     * The legacy `useEncryptedSearch` instance. While the v2 content-search index has no event
     * syncing of its own, we keep the legacy ES index up to date by forwarding events to it.
     */
    esLibraryFunctionsV1: FunctionsV1;
    /**
     * Whether v2 is the engine in charge this session (`ContentSearch` flag + the `OVERRIDE_SEARCH_V2`
     * debug toggle, see `EncryptedSearchProvider`). When it isn't, nothing here may drive an indexing
     * job or push status/progress: the provider hands v1's functions to the UI, so anything this hook
     * reports goes nowhere. `handleEvent` stays live regardless — see `ESAdapter.handleEvent`.
     */
    isActive: boolean;
}

/**
 * The provider spreads the returned functions into the context value, and consumers destructure and
 * call them detached (e.g. `const { encryptedSearch } = useEncryptedSearchContext()`). Both require
 * own, `this`-bound properties, so we expose the {@link ESAdapter} (whose methods live on the
 * prototype) as a plain object literal of instance-bound methods.
 */
const toBoundFunctions = (adapter: ESAdapter): FunctionsV2 => ({
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
});

/**
 * Content-search counterpart of {@link useEncryptedSearch}. It exposes the same
 * {@link EncryptedSearchFunctions} surface — implemented, hook-free, in {@link ESAdapter} — so it can
 * be swapped in behind the `ContentSearch` feature flag. This hook owns the adapter's lifecycle and,
 * mirroring V1, the reactive surface (esStatus/esIndexingProgressState/progressRecorderRef): the
 * adapter drives these through the setters passed at construction, and the hook rebuilds the returned
 * functions object whenever they change so consumers re-render — exactly like `useEncryptedSearch`.
 */
export const useContentSearch = ({ esCallbacks, esLibraryFunctionsV1, isActive }: Props): FunctionsV1 => {
    const [user] = useUser();
    const getUserKeys = useGetUserKeys();

    // The reactive surface, owned by the hook. The adapter pushes updates into these via the setters
    // passed at construction (see below). progressRecorderRef stays a ref like in V1 — it's the raw
    // [indexed, total] counter — but it's paired with the esIndexingProgressState state update so a
    // progress tick still triggers a re-render (a ref write alone wouldn't).
    const [esStatus, setESStatus] = useState<ESStatusConcrete>(defaultESStatus);
    const [esIndexingProgressState, setESIndexingProgressState] = useState<ESIndexingState>(defaultESIndexingState);
    const progressRecorderRef = useRef<ESTimepoint>([0, 0]);

    // A ref, not useMemo: the adapter owns imperative state that must survive every render — the
    // lazily cold-started search worker and the current search state (see ESAdapter.searchService/lastSearch).
    // useMemo is only a hint (React may drop and recompute it), which would silently re-cold-start
    // the worker and lose the cache. The ref also lets us keep a single stable instance while the
    // per-render deps (esCallbacks/esLibraryFunctionsV1, which change most renders) are refreshed
    // onto it below — rather than recreating it, which is what encoding them as memo deps would do.
    // It only depends on the userID which doesn't change within the lifetime of the app.
    const adapterRef = useRef<ESAdapter>();
    if (!adapterRef.current) {
        const indexService = getSharedIndexService(user.ID, getUserKeys);
        const searchService = new SearchService(user.ID, getUserKeys, indexService.dbLock);
        adapterRef.current = new ESAdapter({
            searchService,
            indexService,
            esCallbacks,
            esLibraryFunctionsV1,
            updateESStatus: setESStatus,
            updateESProgress: (timepoint, progressState) => {
                progressRecorderRef.current = timepoint;
                setESIndexingProgressState(progressState);
            },
        });
    }
    const adapter = adapterRef.current;

    // Refresh the per-render dependencies on the (stable) adapter so its bound methods never read
    // stale values — esLibraryFunctionsV1's identity changes when V1's esStatus does.
    adapter.esCallbacks = esCallbacks;
    adapter.esLibraryFunctionsV1 = esLibraryFunctionsV1;
    adapter.isActive = isActive;

    // Observe V1's status and progress and forward them into the adapter, which decides what to push
    // back out through the setters above. Kept as two channels so the import-on-completion side effect
    // (status) and the progress bar updates stay independent.
    const v1Status = esLibraryFunctionsV1.esStatus;
    const v1Timepoint = esLibraryFunctionsV1.progressRecorderRef.current;
    const v1ProgressState = esLibraryFunctionsV1.esIndexingProgressState;

    useEffect(() => {
        if (isActive) {
            adapter.onV1StatusUpdate(v1Status);
        }
    }, [isActive, adapter, v1Status]);

    useEffect(() => {
        if (isActive) {
            adapter.onV1ProgressUpdate(v1Timepoint, v1ProgressState);
        }
    }, [isActive, adapter, v1Timepoint, v1ProgressState]);

    const isSearchOpen = isSearch(useMailSelector(selectSearch));
    useEffect(() => {
        if (isActive && !isSearchOpen) {
            adapter.leaveSearch();
        }
    }, [isActive, adapter, isSearchOpen]);

    const isSearching = useMailSelector(esSearching);

    // Rebuild the functions object whenever the reactive surface changes — the same mechanism V1 uses
    // (its `useMemo` keyed on esStatus/esIndexingProgressState). The bound method surface is stable, so
    // a new object identity here is what propagates fresh status/progress to consumers.
    return useMemo<FunctionsV1>(
        () => ({
            ...toBoundFunctions(adapter),
            esStatus: {
                ...esStatus,
                // we don't have a cache and doesn't do partial searches
                getCacheStatus: () => ({ isCacheReady: true, isCacheLimited: false }),
                isSearchPartial: false,
                // Whether a search is in flight is counted around every `encryptedSearch` call by
                // `useApplyEncryptedSearch` — for v2 that is this adapter, and the count spans the
                // whole search, since `encryptedSearch` doesn't resolve until the search is done.
                isSearching,
            },
            esIndexingProgressState,
            progressRecorderRef,
        }),
        [adapter, esStatus, esIndexingProgressState, isSearching]
    );
};
