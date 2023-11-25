import { put, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { trashItems } from '@proton/pass/lib/items/item.requests';
import { getItemActionId } from '@proton/pass/lib/items/item.utils';
import { itemTrashFailure, itemTrashIntent, itemTrashSuccess, notification } from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/with-receiver';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* trashItemWorker(
    { onItemsUpdated }: RootSagaOptions,
    { payload, meta }: WithSenderAction<ReturnType<typeof itemTrashIntent>>
) {
    const { item, shareId } = payload;
    const { callback: onItemTrashProcessed } = meta;

    try {
        yield trashItems([item]);
        const itemTrashSuccessAction = itemTrashSuccess({ itemId: item.itemId, shareId });
        yield put(itemTrashSuccessAction);

        /* alias specific notification on trash :
         * this will override the default trash success
         * notification by deduplicating a new notification
         * with the same key */
        yield item.data.type === 'alias' &&
            put(
                notification({
                    type: 'info',
                    key: getItemActionId(payload),
                    endpoint: meta.sender?.endpoint,
                    text: c('Info')
                        .t`Alias "${item.aliasEmail}" moved to trash - it will stop forwarding emails to your mailbox`,
                })
            );

        onItemTrashProcessed?.(itemTrashSuccessAction);
        onItemsUpdated?.();
    } catch (e) {
        const itemTrashFailureAction = itemTrashFailure({ itemId: item.itemId, shareId }, e);
        yield put(itemTrashFailureAction);

        onItemTrashProcessed?.(itemTrashFailureAction);
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(itemTrashIntent.match, trashItemWorker, options);
}
