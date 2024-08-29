import { toggleAliasStatus } from '@proton/pass/lib/alias/alias.requests';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { aliasToggleStatus } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: aliasToggleStatus,
    call: async ({ shareId, itemId, enabled: enable }) => {
        const encryptedItem = await toggleAliasStatus({ shareId, itemId, enabled: enable });
        if (!encryptedItem) throw new Error();

        const item = await parseItemRevision(shareId, encryptedItem);
        return { shareId, itemId, item };
    },
});
