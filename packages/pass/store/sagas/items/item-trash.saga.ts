import { trashItems } from '../../../lib/items/item.requests';
import { itemTrash } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: itemTrash,
    call: async (payload) => {
        await trashItems([payload]);
        return payload;
    },
});
