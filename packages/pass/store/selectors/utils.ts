import { createSelectorCreator } from '@reduxjs/toolkit';

import type { State } from '@proton/pass/store/types';
import identity from '@proton/utils/identity';

export const EMPTY_LIST: any[] = [];
export const NOOP_LIST_SELECTOR = <T>() => EMPTY_LIST as T[];
export const selectState = identity<State>;

/** Creates selectors without memoization caching for use in sagas
 * or service-workers outside of the react life-cycle where we're
 * not interested in caching the selector result. This is mostly to
 * be able to use the `createSelector` composition pattern without
 * any caching logic whatsoever */
export const createUncachedSelector = createSelectorCreator({
    memoize: identity,
    devModeChecks: {
        inputStabilityCheck: 'never',
        identityFunctionCheck: 'never',
    },
});
