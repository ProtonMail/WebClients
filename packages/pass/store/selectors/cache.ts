import { asIfNotOptimistic } from '@proton/pass/store/optimistic/selectors/select-is-optimistic';
import { reducerMap } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import { objectFilter } from '@proton/pass/utils/object/filter';

export const selectCachableState = (state: State) => {
    const whiteListedState = asIfNotOptimistic(state, reducerMap);

    /** Remove monitoring data - revalidate on boot */
    whiteListedState.monitor = null;

    /** Filter stale request metadata and optimisticIds */
    whiteListedState.items.byOptimisticId = {};
    whiteListedState.request = objectFilter(
        whiteListedState.request,
        (_, request) => request.status === 'success' && request.maxAge !== undefined
    );

    return whiteListedState;
};
