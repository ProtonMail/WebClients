import { SyncStrategy } from '@proton/pass/lib/sync/types';
import { asIfNotOptimistic } from '@proton/pass/store/optimistic/selectors/select-is-optimistic';
import { getInitialPATState, reducerMap } from '@proton/pass/store/reducers';
import { selectSyncStrategy } from '@proton/pass/store/selectors/settings';
import type { State } from '@proton/pass/store/types';
import { objectFilter } from '@proton/pass/utils/object/filter';
import { partialMerge } from '@proton/pass/utils/object/merge';

export const selectCachableState = (state: State) => {
    const cachable = asIfNotOptimistic(state, reducerMap);
    const legacySync = selectSyncStrategy(state) === SyncStrategy.LEGACY;

    /** Remove "hot" data that should never be cached.
     * These should be revalidated on boot or via polling. */
    cachable.items.secureLinks = {};
    cachable.user = partialMerge(cachable.user, { devices: [] });
    cachable.access = {};
    cachable.alias = { aliasDetails: {}, aliasOptions: null, mailboxes: null };
    cachable.files = {};
    cachable.accessTokens = getInitialPATState();
    cachable.ui = { values: {} };
    cachable.compromisedPasswords = { ...cachable.compromisedPasswords, progress: { completed: 0, total: 0 } };

    /** V2 user events provide granular invite updates, safe to cache */
    if (legacySync) {
        cachable.invites = {};
        cachable.monitor = null;
    }

    /** Filter stale request metadata and optimisticIds */
    cachable.items.byOptimisticId = {};
    cachable.request = objectFilter(
        cachable.request,
        (_, request) => request.status === 'success' && request.maxAge !== undefined && !request.hot
    );

    return cachable;
};
