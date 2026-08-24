import { call, select } from 'redux-saga/effects';

import { moveItems } from '../../../lib/items/item.requests';
import type { ItemRevision, Maybe } from '../../../types';
import { first } from '../../../utils/array/first';
import { itemMove } from '../../actions';
import { createRequestSaga } from '../../request/sagas';
import { selectItem } from '../../selectors';

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
