import type { Middleware } from 'redux';

import type { ItemRevision } from '../../types';
import { itemEdit } from '../actions';
import { selectItem } from '../selectors';
import type { State } from '../types';

export type ItemEditIntentAction = ReturnType<typeof itemEdit.intent> & {
    meta: ReturnType<typeof itemEdit.intent>['meta'] & { previousItem?: ItemRevision };
};

/** `itemEdit.intent` is applied optimistically by the items reducer, and
 * redux-saga always runs reducers before notifying watching sagas of that
 * same action -- so a saga reacting to `itemEdit.intent`/`.success` can
 * never read the pre-edit item itself. This runs ahead of the reducer and
 * attaches it generically, so any interested saga can diff old vs new
 * without the dispatching UI needing to know who's interested. */
export const itemEditMiddleware: Middleware<{}, State> =
    ({ getState }) =>
    (next) =>
    (action) => {
        if (itemEdit.intent.match(action)) {
            const { shareId, itemId } = action.payload;
            const previousItem = selectItem(shareId, itemId)(getState());
            return next({ ...action, meta: { ...action.meta, previousItem } });
        }

        return next(action);
    };
