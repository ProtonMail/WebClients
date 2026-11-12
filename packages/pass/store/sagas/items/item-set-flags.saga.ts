import { parseItemRevision } from '../../../lib/items/item.parser';
import { updateItemFlags } from '../../../lib/items/item.requests';
import { setItemFlags } from '../../actions/creators/monitor';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: setItemFlags,
    call: async ({ shareId, itemId, flags, context, checkType }) => {
        const encryptedItem = await updateItemFlags(shareId, itemId, flags);
        const item = await parseItemRevision(shareId, encryptedItem);
        return { shareId, itemId, item, context, checkType };
    },
});
