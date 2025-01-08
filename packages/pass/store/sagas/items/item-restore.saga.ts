import { select } from 'redux-saga/effects';

import { restoreItems } from '@proton/pass/lib/items/item.requests';
import { itemRestore } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectItem } from '@proton/pass/store/selectors';
import type { ItemRevision, Maybe } from '@proton/pass/types';

export default createRequestSaga({
    actions: itemRestore,
    call: function* (selectedItem, { onItemsUpdated }) {
        const { shareId, itemId } = selectedItem;
        const item: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
        if (!item) throw new Error('Invalid restore action');

        yield restoreItems([item]);
        onItemsUpdated?.();
        return selectedItem;
    },
});
