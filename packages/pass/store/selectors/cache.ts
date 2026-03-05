import { asIfNotOptimistic } from '@proton/pass/store/optimistic/selectors/select-is-optimistic';
import { reducerMap } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import { objectFilter } from '@proton/pass/utils/object/filter';
import { partialMerge } from '@proton/pass/utils/object/merge';

export const selectCachableState = (state: State) => {
    const cachable = asIfNotOptimistic(state, reducerMap);

    /** Remove "hot" data that should never be cached.
     * These should be revalidated on boot or via polling. */
    cachable.monitor = null;
    cachable.items.secureLinks = {};
    cachable.invites = {};
    cachable.user = partialMerge(cachable.user, { devices: [] });
    cachable.access = {};
    cachable.alias = { aliasDetails: {}, aliasOptions: null, mailboxes: null };
    cachable.files = {};
    cachable.groups = {};

    /** Filter stale request metadata and optimisticIds */
    cachable.items.byOptimisticId = {};
    cachable.request = objectFilter(
        cachable.request,
        (_, request) => request.status === 'success' && request.maxAge !== undefined && !request.hot
    );

    return cachable;
};
