import { call, select } from 'redux-saga/effects';

import { restoreItems } from '../../../lib/items/item.requests';
import type { ItemRevision, Maybe } from '../../../types';
import { itemRestore } from '../../actions';
import { createRequestSaga } from '../../request/sagas';
import { selectItem } from '../../selectors';

export default createRequestSaga({
    actions: itemRestore,
    call: function* (selectedItem) {
        const { shareId, itemId } = selectedItem;
        const item: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
        if (!item) throw new Error('Invalid restore action');

        yield call(restoreItems, [item]);
        return selectedItem;
    },
});
