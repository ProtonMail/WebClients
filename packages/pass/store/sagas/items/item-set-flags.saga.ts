import { parseItemRevision } from '../../../lib/items/item.parser';
import { updateItemFlags } from '../../../lib/items/item.requests';
import { setItemFlags } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: setItemFlags,
    call: async ({ shareId, itemId, SkipHealthCheck }) => {
        const encryptedItem = await updateItemFlags(shareId, itemId, { SkipHealthCheck });
        const item = await parseItemRevision(shareId, encryptedItem);
        return { shareId, itemId, item: item };
    },
});
