import { select } from 'redux-saga/effects';

import { moveItem } from '@proton/pass/lib/items/item.requests';
import { itemMove } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectItem } from '@proton/pass/store/selectors';
import type { ItemRevision, Maybe } from '@proton/pass/types';

export default createRequestSaga({
    actions: itemMove,
    call: function* ({ itemId, shareId, destinationShareId }, { onItemsUpdated }) {
        const before: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
        if (!before) throw new Error('Invalid move action');

        const after: ItemRevision = yield moveItem(before, shareId, destinationShareId);
        onItemsUpdated?.();
        return { before, after };
    },
});
