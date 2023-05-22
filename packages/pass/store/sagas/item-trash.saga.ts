import { put, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { getItemActionId } from '@proton/pass/utils/pass/items';

import { itemTrashFailure, itemTrashIntent, itemTrashSuccess, notification } from '../actions';
import type { WithSenderAction } from '../actions/with-receiver';
import type { WorkerRootSagaOptions } from '../types';
import { trashItems } from './workers/items';

function* trashItemWorker(
    { onItemsChange }: WorkerRootSagaOptions,
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
                    receiver: meta.sender?.endpoint,
                    text: c('Info')
                        .t`Alias "${item.aliasEmail}" moved to trash - it will stop forwarding emails to your mailbox`,
                })
            );

        onItemTrashProcessed?.(itemTrashSuccessAction);
        onItemsChange?.();
    } catch (e) {
        const itemTrashFailureAction = itemTrashFailure({ itemId: item.itemId, shareId }, e);
        yield put(itemTrashFailureAction);

        onItemTrashProcessed?.(itemTrashFailureAction);
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(itemTrashIntent.match, trashItemWorker, options);
}
