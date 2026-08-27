import { SyncStrategy } from '../../lib/sync/types';
import { objectFilter } from '../../utils/object/filter';
import { partialMerge } from '../../utils/object/merge';
import { asIfNotOptimistic } from '../optimistic/selectors/select-is-optimistic';
import { getInitialPATState, reducerMap } from '../reducers';
import type { State } from '../types';
import { selectSyncStrategy } from './settings';

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
    cachable.assignedModelId = null;
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
