import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { getItemActionId } from '@proton/pass/lib/items/item.utils';
import { withCache } from '@proton/pass/store/actions/with-cache';
import type { ActionCallback } from '@proton/pass/store/actions/with-callback';
import withCallback from '@proton/pass/store/actions/with-callback';
import withNotification from '@proton/pass/store/actions/with-notification';
import withSynchronousClientAction from '@proton/pass/store/actions/with-synchronous-client-action';
import { createOptimisticAction } from '@proton/pass/store/optimistic/action/create-optimistic-action';
import type { ItemDraft } from '@proton/pass/store/reducers';
import type { ItemCreateIntent, ItemEditIntent, ItemRevision, SelectedItem } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const itemDraftSave = createAction('item::draft::save', (payload: ItemDraft) => ({ payload }));
export const itemDraftDiscard = createAction('item::draft::discard', () => ({ payload: {} }));

export const itemCreationIntent = createOptimisticAction(
    'item::creation::intent',
    (
        payload: ItemCreateIntent,
        callback?: ActionCallback<ReturnType<typeof itemCreationSuccess> | ReturnType<typeof itemCreationFailure>>
    ) => pipe(withSynchronousClientAction, withCallback(callback))({ payload }),
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
    ) => pipe(withSynchronousClientAction, withCallback(callback))({ payload }),
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
    (payload: { item: ItemRevision; shareId: string; optimisticId: string }) =>
        withSynchronousClientAction({ payload }),
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

export const itemAutofilled = createAction('item::autofilled', (payload: SelectedItem) => ({ payload }));

export const itemUsedSync = createAction(
    'item::used::sync',
    (payload: { shareId: string; itemId: string; lastUseTime: number }) => withCache({ payload })
);
