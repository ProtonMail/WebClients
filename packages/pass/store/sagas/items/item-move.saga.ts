import { select } from 'redux-saga/effects';

import { moveItems } from '@proton/pass/lib/items/item.requests';
import { itemMove } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectItem } from '@proton/pass/store/selectors';
import type { ItemRevision, Maybe } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';

export default createRequestSaga({
    actions: itemMove,
    call: function* ({ itemId, shareId, targetShareId }, { onItemsUpdated }) {
        const before: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
        if (!before) throw new Error('Invalid move action');

        const after = first((yield moveItems([before], targetShareId)) as ItemRevision[]);
        if (!after) throw new Error('Moving item failed');

        onItemsUpdated?.();
        return { before, after };
    },
});
