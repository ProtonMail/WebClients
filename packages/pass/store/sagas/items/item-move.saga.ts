import { call, select } from 'redux-saga/effects';

import { moveItems } from '@proton/pass/lib/items/item.requests';
import { itemMove } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectItem } from '@proton/pass/store/selectors';
import type { ItemRevision, Maybe } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';

export default createRequestSaga({
    actions: itemMove,
    call: function* ({ itemId, shareId, targetShareId }) {
        const before: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
        if (!before) throw new Error('Invalid move action');

        const moved: ItemRevision[] = yield call(moveItems, [before], targetShareId);
        const after = first(moved);
        if (!after) throw new Error('Moving item failed');

        return { before, after };
    },
});
