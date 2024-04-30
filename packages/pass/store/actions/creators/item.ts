import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { getItemActionId } from '@proton/pass/lib/items/item.utils';
import { withCache, withThrottledCache } from '@proton/pass/store/actions/enhancers/cache';
import { type ActionCallback, withCallback } from '@proton/pass/store/actions/enhancers/callback';
import { withSynchronousAction } from '@proton/pass/store/actions/enhancers/client';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import {
    itemPinRequest,
    itemRevisionsRequest,
    itemUnpinRequest,
    itemsBulkDeleteRequest,
    itemsBulkMoveRequest,
    itemsBulkRestoreRequest,
    itemsBulkTrashRequest,
} from '@proton/pass/store/actions/requests';
import { createOptimisticAction } from '@proton/pass/store/optimistic/action/create-optimistic-action';
import type { Draft, DraftBase } from '@proton/pass/store/reducers';
import {
    withRequest,
    withRequestFailure,
    withRequestProgress,
    withRequestSuccess,
} from '@proton/pass/store/request/enhancers';
import type {
    BatchItemRevisionIDs,
    BatchItemRevisions,
    BulkSelectionDTO,
    ItemCreateIntent,
    ItemEditIntent,
    ItemRevision,
    ItemRevisionsIntent,
    ItemRevisionsSuccess,
    SelectedItem,
    UniqueItem,
} from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const draftSave = createAction('draft::save', (payload: Draft) => withThrottledCache({ payload }));
export const draftDiscard = createAction('draft::discard', (payload: DraftBase) => withThrottledCache({ payload }));
export const draftsGarbageCollect = createAction('drafts::gc', () => withThrottledCache({ payload: {} }));

export const itemCreationIntent = createOptimisticAction(
    'item::creation::intent',
    (
        payload: ItemCreateIntent,
        callback?: ActionCallback<ReturnType<typeof itemCreationSuccess> | ReturnType<typeof itemCreationFailure>>
    ) => pipe(withSynchronousAction, withCallback(callback))({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemCreationFailure = createOptimisticAction(
    'item::creation::failure',
    (payload: { optimisticId: string; shareId: string }, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Item creation failed`,
            error,
        })({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemCreationDismiss = createOptimisticAction(
    'item::creation::dismiss',
    (payload: { optimisticId: string; shareId: string; item: ItemRevision }) =>
        withNotification({
            type: 'info',
            text: c('Info').t`"${payload.item.data.metadata.name}" item was dismissed`,
        })({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemCreationSuccess = createOptimisticAction(
    'item::creation::success',
    (payload: { optimisticId: string; shareId: string; item: ItemRevision; alias?: ItemRevision }) =>
        pipe(
            withCache,
            withNotification({
                type: 'success',
                text: c('Info').t`Item "${payload.item.data.metadata.name}" created`,
            })
        )({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemEditIntent = createOptimisticAction(
    'item::edit::intent',
    (
        payload: ItemEditIntent,
        callback?: ActionCallback<ReturnType<typeof itemEditSuccess> | ReturnType<typeof itemEditFailure>>
    ) => pipe(withSynchronousAction, withCallback(callback))({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemEditFailure = createOptimisticAction(
    'item::edit::failure',
    (payload: SelectedItem, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Editing item failed`,
            error,
        })({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemEditDismiss = createOptimisticAction(
    'item::edit::dismiss',
    (payload: { itemId: string; shareId: string; item: ItemRevision }) =>
        withNotification({
            type: 'info',
            text: c('Info').t`"${payload.item.data.metadata.name}" update was dismissed`,
        })({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemEditSuccess = createOptimisticAction(
    'item::edit::success',
    (payload: { item: ItemRevision } & SelectedItem) =>
        pipe(
            withCache,
            withNotification({
                type: 'success',
                text: c('Info').t`Item "${payload.item.data.metadata.name}" updated`,
            })
        )({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemEditSync = createAction('item::edit::sync', (payload: { item: ItemRevision } & SelectedItem) =>
    withCache({ payload })
);

export const itemMoveIntent = createOptimisticAction(
    'item::move::intent',
    (payload: { item: ItemRevision; shareId: string; optimisticId: string }) => withSynchronousAction({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemMoveFailure = createOptimisticAction(
    'item::move::failure',
    (payload: { optimisticId: string; shareId: string; item: ItemRevision }, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Moving item failed`,
            error,
        })({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemMoveSuccess = createOptimisticAction(
    'item::move::success',
    (payload: { item: ItemRevision; optimisticId: string; shareId: string }) =>
        pipe(
            withCache,
            withNotification({
                type: 'success',
                text: c('Info').t`Item successfully moved`,
            })
        )({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemBulkMoveIntent = createAction(
    'item::bulk::move::intent',
    (payload: { selected: BulkSelectionDTO; shareId: string }) =>
        pipe(
            withRequest({ status: 'start', id: itemsBulkMoveRequest() }),
            withNotification({
                expiration: -1,
                type: 'info',
                loading: true,
                text: c('Info').t`Moving items`,
            })
        )({ payload })
);

export const itemBulkMoveFailure = createAction(
    'item::bulk::move::failure',
    withRequestFailure((payload: {}, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to move items`,
            error,
        })({ payload, error })
    )
);

export const itemBulkMoveProgress = createAction(
    'item::bulk::move::progress',
    withRequestProgress((payload: BatchItemRevisions & { movedItems: ItemRevision[]; destinationShareId: string }) =>
        withCache({ payload })
    )
);

export const itemBulkMoveSuccess = createAction(
    'item::bulk::move::success',
    withRequestSuccess((payload: {}) =>
        withNotification({
            type: 'info',
            text: c('Info').t`All items successfully moved`,
        })({ payload })
    )
);

export const itemTrashIntent = createOptimisticAction(
    'item::trash::intent',
    (
        payload: { item: ItemRevision } & SelectedItem,
        callback?: ActionCallback<ReturnType<typeof itemTrashSuccess> | ReturnType<typeof itemTrashFailure>>
    ) => withCallback(callback)({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemTrashFailure = createOptimisticAction(
    'item::trash::failure',
    (payload: SelectedItem, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Trashing item failed`,
            error,
        })({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemTrashSuccess = createOptimisticAction(
    'item::trash::success',
    (payload: SelectedItem) =>
        pipe(
            withCache,
            withNotification({
                type: 'success',
                key: getItemActionId(payload),
                text: c('Info').t`Item moved to trash`,
            })
        )({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemBulkTrashIntent = createAction(
    'item::bulk::trash::intent',
    (payload: { selected: BulkSelectionDTO }) =>
        pipe(
            withRequest({ status: 'start', id: itemsBulkTrashRequest() }),
            withNotification({
                expiration: -1,
                type: 'info',
                loading: true,
                text: c('Info').t`Moving items to trash`,
            })
        )({ payload })
);

export const itemBulkTrashFailure = createAction(
    'item::bulk::trash::failure',
    withRequestFailure((payload: {}, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to move items to trash`,
            error,
        })({ payload, error })
    )
);

export const itemBulkTrashProgress = createAction(
    'item::bulk::trash::progress',
    withRequestProgress((payload: BatchItemRevisionIDs) => withCache({ payload }))
);

export const itemBulkTrashSuccess = createAction(
    'item::bulk::trash::success',
    withRequestSuccess((payload: {}) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Selected items successfully moved to trash`,
        })({ payload })
    )
);

export const itemDeleteIntent = createOptimisticAction(
    'item::delete::intent',
    (
        payload: { item: ItemRevision } & SelectedItem,
        callback?: ActionCallback<ReturnType<typeof itemDeleteSuccess> | ReturnType<typeof itemDeleteFailure>>
    ) => withCallback(callback)({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemDeleteFailure = createOptimisticAction(
    'item::delete::failure',
    (payload: SelectedItem, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Deleting item failed`,
            error,
        })({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemDeleteSuccess = createOptimisticAction(
    'item::delete::success',
    (payload: SelectedItem) =>
        pipe(
            withCache,
            withNotification({
                type: 'success',
                text: c('Info').t`Item permanently deleted`,
            })
        )({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemBulkDeleteIntent = createAction(
    'item::bulk::delete::intent',
    (payload: { selected: BulkSelectionDTO }) =>
        pipe(
            withRequest({ status: 'start', id: itemsBulkDeleteRequest() }),
            withNotification({
                expiration: -1,
                type: 'info',
                loading: true,
                text: c('Info').t`Permanently deleting selected items`,
            })
        )({ payload })
);

export const itemBulkDeleteFailure = createAction(
    'item::bulk::delete::failure',
    withRequestFailure((payload: {}, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to delete selected items`,
            error,
        })({ payload, error })
    )
);

export const itemBulkDeleteProgress = createAction(
    'item::bulk::delete::progress',
    withRequestProgress((payload: BatchItemRevisionIDs) => withCache({ payload }))
);

export const itemBulkDeleteSuccess = createAction(
    'item::bulk::delete::success',
    withRequestSuccess((payload: {}) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Selected items permanently deleted`,
        })({ payload })
    )
);

export const itemDeleteSync = createAction('item::delete::sync', (payload: SelectedItem) => withCache({ payload }));

export const itemRestoreIntent = createOptimisticAction(
    'item::restore::intent',
    (
        payload: { item: ItemRevision } & SelectedItem,
        callback?: ActionCallback<ReturnType<typeof itemRestoreSuccess> | ReturnType<typeof itemRestoreFailure>>
    ) => withCallback(callback)({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemRestoreFailure = createOptimisticAction(
    'item::restore::failure',
    (payload: SelectedItem, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Restoring item failed`,
            error,
        })({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemRestoreSuccess = createOptimisticAction(
    'item::restore::success',
    (payload: SelectedItem) =>
        pipe(
            withCache,
            withNotification({
                type: 'success',
                text: c('Info').t`Item restored`,
            })
        )({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemBulkRestoreIntent = createAction(
    'item::bulk:restore::intent',
    (payload: { selected: BulkSelectionDTO }) =>
        pipe(
            withRequest({ status: 'start', id: itemsBulkRestoreRequest() }),
            withNotification({
                expiration: -1,
                type: 'info',
                loading: true,
                text: c('Info').t`Restoring items from trash`,
            })
        )({ payload })
);

export const itemBulkRestoreFailure = createAction(
    'item::bulk::restore::failure',
    withRequestFailure((payload: {}, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to restore items from trash`,
            error,
        })({ payload, error })
    )
);

export const itemBulkRestoreProgress = createAction(
    'item::bulk::restore::progress',
    withRequestProgress((payload: BatchItemRevisionIDs) => withCache({ payload }))
);

export const itemBulkRestoreSuccess = createAction(
    'item::bulk::restore::success',
    withRequestSuccess((payload: {}) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Selected items successfully restored from trash`,
        })({ payload })
    )
);

export const itemAutofilled = createAction('item::autofilled', (payload: SelectedItem) => ({ payload }));

export const itemUsedSync = createAction(
    'item::used::sync',
    (payload: { shareId: string; itemId: string; lastUseTime: number }) => withCache({ payload })
);

export const itemPinIntent = createAction('item::pin::intent', (payload: UniqueItem) =>
    pipe(
        withRequest({ status: 'start', id: itemPinRequest(payload.shareId, payload.itemId) }),
        withNotification({
            type: 'info',
            text: c('Info').t`Pinning item...`,
            loading: true,
            expiration: -1,
        })
    )({ payload })
);

export const itemPinSuccess = createAction(
    'item::pin::success',
    withRequestSuccess((payload: UniqueItem) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Item successfully pinned`,
            })
        )({ payload })
    )
);

export const itemPinFailure = createAction(
    'item::pin::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to pin item`,
            error,
        })({ payload: {}, error })
    )
);

export const itemUnpinIntent = createAction('item::unpin::intent', (payload: UniqueItem) =>
    pipe(
        withRequest({ status: 'start', id: itemUnpinRequest(payload.shareId, payload.itemId) }),
        withNotification({
            type: 'info',
            text: c('Info').t`Unpinning item...`,
            loading: true,
            expiration: -1,
        })
    )({ payload })
);

export const itemUnpinSuccess = createAction(
    'item::unpin::success',
    withRequestSuccess((payload: UniqueItem) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Item successfully unpinned`,
            })
        )({ payload })
    )
);

export const itemUnpinFailure = createAction(
    'item::unpin::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to unpin item`,
            error,
        })({ payload: {}, error })
    )
);

export const itemHistoryIntent = createAction('item::history::intent', (payload: ItemRevisionsIntent) =>
    withRequest({ status: 'start', id: itemRevisionsRequest(payload.shareId, payload.itemId) })({ payload })
);

export const itemHistorySuccess = createAction(
    'item::history::success',
    withRequestSuccess((payload: ItemRevisionsSuccess) => ({ payload }), { data: true })
);

export const itemHistoryFailure = createAction(
    'item::history::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to load item history`,
            error,
        })({ payload: {}, error })
    )
);
