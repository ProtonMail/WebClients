import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { updateItemFlags } from '@proton/pass/lib/items/item.requests';
import { setItemFlags } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: setItemFlags,
    call: async ({ shareId, itemId, SkipHealthCheck }) => {
        const encryptedItem = await updateItemFlags(shareId, itemId, { SkipHealthCheck });
        const item = await parseItemRevision(shareId, encryptedItem);
        return { shareId, itemId, item: item };
    },
});
