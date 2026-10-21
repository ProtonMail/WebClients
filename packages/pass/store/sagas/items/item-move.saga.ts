import { call, select } from 'redux-saga/effects';

import { moveItems } from '../../../lib/items/item.requests';
import type { ItemRevision } from '../../../types/data/items';
import type { Maybe } from '../../../types/utils';
import { first } from '../../../utils/array/first';
import { itemMove } from '../../actions/creators/item';
import { createRequestSaga } from '../../request/sagas';
import { selectItem } from '../../selectors/items';

export default createRequestSaga({
    actions: itemMove,
    call: function* ({ itemId, shareId, targetShareId, targetFolderId }) {
        const before: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
        if (!before) throw new Error('Invalid move action');

        const moved: ItemRevision[] = yield call(moveItems, [before], { targetShareId, targetFolderId });
        const after = first(moved);
        if (!after) throw new Error('Moving item failed');

        return { before, after };
    },
});
