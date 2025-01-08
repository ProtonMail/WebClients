import { trashItems } from '@proton/pass/lib/items/item.requests';
import { itemTrash } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: itemTrash,
    call: async (payload, { onItemsUpdated }) => {
        await trashItems([payload]);
        onItemsUpdated?.();
        return payload;
    },
});
