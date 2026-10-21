import { call, select } from 'redux-saga/effects';

import { restoreItems } from '../../../lib/items/item.requests';
import type { ItemRevision } from '../../../types/data/items';
import type { Maybe } from '../../../types/utils';
import { itemRestore } from '../../actions/creators/item';
import { createRequestSaga } from '../../request/sagas';
import { selectItem } from '../../selectors/items';

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
