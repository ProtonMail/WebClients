import { asIfNotOptimistic } from '@proton/pass/store/optimistic/selectors/select-is-optimistic';
import { reducerMap } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import { objectFilter } from '@proton/pass/utils/object/filter';
import { partialMerge } from '@proton/pass/utils/object/merge';

export const selectCachableState = (state: State) => {
    const whiteListedState = asIfNotOptimistic(state, reducerMap);

    /** Remove "hot" data that should never be cached.
     * These should be revalidated on boot or via polling. */
    whiteListedState.monitor = null;
    whiteListedState.items.secureLinks = {};
    whiteListedState.invites = {};
    whiteListedState.user = partialMerge(whiteListedState.user, { devices: [] });
    whiteListedState.access = {};
    whiteListedState.alias = { aliasDetails: {}, aliasOptions: null, mailboxes: null };
    whiteListedState.files = {};

    /** Filter stale request metadata and optimisticIds */
    whiteListedState.items.byOptimisticId = {};
    whiteListedState.request = objectFilter(
        whiteListedState.request,
        (requestId, request) =>
            // FIXME: add non-cachable flag on request metadata
            request.status === 'success' && request.maxAge !== undefined && !requestId.startsWith('files::')
    );

    return whiteListedState;
};
