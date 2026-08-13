import type { Middleware } from 'redux';

import { itemEdit } from '@proton/pass/store/actions';
import { selectItem } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';

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
