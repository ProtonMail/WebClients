import type { AnyAction, PayloadActionCreator, PrepareAction } from '@reduxjs/toolkit';
import { createAction } from '@reduxjs/toolkit';

import type { OptimisticMatcherResult } from '../types';

/**
 * Wraps the @reduxjs/toolkit createAction helper utility.
 * Requires passing an additional parameter to derive an
 * optimistic identifier from the resulting action.
 *
 * Adds a static property `actionCreator::matchOptimistic`
 * method on the returned action creator which wraps the
 * default `actionCreator::match` function but will return
 * the derived optimistic id when a match arises. This is
 * mainly to make it easier to write optimistic matchers.
 */
export const createOptimisticAction = <
    PA extends PrepareAction<any>,
    T extends string = string,
    OptimisticAction = ReturnType<PayloadActionCreator<ReturnType<PA>['payload'], T, PA>>
>(
    type: T,
    prepare: PA,
    optimisticIdFactory: (action: OptimisticAction) => string
) => {
    const actionCreator = createAction(type, prepare) as PayloadActionCreator<ReturnType<PA>['payload'], T, PA> & {
        optimisticMatch: (action: AnyAction) => OptimisticMatcherResult;
    };

    actionCreator.optimisticMatch = (action: AnyAction) =>
        actionCreator.match(action) && optimisticIdFactory(action as OptimisticAction);

    return actionCreator;
};
