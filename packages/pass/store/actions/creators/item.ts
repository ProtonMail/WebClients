import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ItemCreateIntent, ItemEditIntent, ItemRevision, SelectedItem } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';
import { getItemActionId } from '@proton/pass/utils/pass/items';

import { createOptimisticAction } from '../../optimistic/action/create-optimistic-action';
import * as requests from '../requests';
import withCacheBlock from '../with-cache-block';
import type { ActionCallback } from '../with-callback';
import withCallback from '../with-callback';
import withNotification from '../with-notification';
import withRequest from '../with-request';
import withSynchronousClientAction from '../with-synchronous-client-action';

export const itemCreationIntent = createOptimisticAction(
    'item creation intent',
    (
        payload: ItemCreateIntent,
        callback?: ActionCallback<ReturnType<typeof itemCreationSuccess> | ReturnType<typeof itemCreationFailure>>
    ) => pipe(withSynchronousClientAction, withCacheBlock, withCallback(callback))({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemCreationFailure = createOptimisticAction(
    'item creation failure',
    (payload: { optimisticId: string; shareId: string }, error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Item creation failed`,
                error,
            })
        )({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemCreationDismiss = createOptimisticAction(
    'item creation dismiss',
    (payload: { optimisticId: string; shareId: string; item: ItemRevision }) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'info',
                text: c('Info').t`"${payload.item.data.metadata.name}" item was dismissed`,
            })
        )({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemCreationSuccess = createOptimisticAction(
    'item creation success',
    (payload: { optimisticId: string; shareId: string; item: ItemRevision; alias?: ItemRevision }) =>
        withNotification({
            type: 'success',
            text: c('Info').t`Item "${payload.item.data.metadata.name}" created`,
        })({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemEditIntent = createOptimisticAction(
    'item edit intent',
    (
        payload: ItemEditIntent,
        callback?: ActionCallback<ReturnType<typeof itemEditSuccess> | ReturnType<typeof itemEditFailure>>
    ) => pipe(withSynchronousClientAction, withCacheBlock, withCallback(callback))({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemEditFailure = createOptimisticAction(
    'item edit failure',
    (payload: SelectedItem, error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Editing item failed`,
                error,
            })
        )({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemEditDismiss = createOptimisticAction(
    'item edit dismiss',
    (payload: { itemId: string; shareId: string; item: ItemRevision }) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'info',
                text: c('Info').t`"${payload.item.data.metadata.name}" update was dismissed`,
            })
        )({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemEditSuccess = createOptimisticAction(
    'item edit success',
    (payload: { item: ItemRevision } & SelectedItem) =>
        withNotification({
            type: 'success',
            text: c('Info').t`Item "${payload.item.data.metadata.name}" updated`,
        })({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemEditSync = createAction('item edit sync', (payload: { item: ItemRevision } & SelectedItem) => ({
    payload,
}));

export const itemMoveIntent = createOptimisticAction(
    'item move intent',
    (payload: { item: ItemRevision; shareId: string; optimisticId: string }) =>
        pipe(withSynchronousClientAction, withCacheBlock)({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemMoveFailure = createOptimisticAction(
    'item move failure',
    (payload: { optimisticId: string; shareId: string; item: ItemRevision }, error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Moving item failed`,
                error,
            })
        )({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemMoveSuccess = createOptimisticAction(
    'item move success',
    (payload: { item: ItemRevision; optimisticId: string; shareId: string }) =>
        withNotification({
            type: 'success',
            text: c('Info').t`Item successfully moved`,
        })({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemTrashIntent = createOptimisticAction(
    'item trash intent',
    (
        payload: { item: ItemRevision } & SelectedItem,
        callback?: ActionCallback<ReturnType<typeof itemTrashSuccess> | ReturnType<typeof itemTrashFailure>>
    ) => pipe(withCacheBlock, withCallback(callback))({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemTrashFailure = createOptimisticAction(
    'item trash failure',
    (payload: SelectedItem, error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Trashing item failed`,
                error,
            })
        )({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemTrashSuccess = createOptimisticAction(
    'item trash success',
    (payload: SelectedItem) =>
        withNotification({
            type: 'success',
            key: getItemActionId(payload),
            text: c('Info').t`Item moved to trash`,
        })({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemDeleteIntent = createOptimisticAction(
    'item delete intent',
    (
        payload: { item: ItemRevision } & SelectedItem,
        callback?: ActionCallback<ReturnType<typeof itemDeleteSuccess> | ReturnType<typeof itemDeleteFailure>>
    ) => pipe(withCacheBlock, withCallback(callback))({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemDeleteFailure = createOptimisticAction(
    'item delete failure',
    (payload: SelectedItem, error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Deleting item failed`,
                error,
            })
        )({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemDeleteSuccess = createOptimisticAction(
    'item delete success',
    (payload: SelectedItem) =>
        withNotification({
            type: 'success',
            text: c('Info').t`Item permanently deleted`,
        })({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemDeleteSync = createAction('item delete sync', (payload: SelectedItem) => ({
    payload,
}));

export const itemRestoreIntent = createOptimisticAction(
    'restore item intent',
    (
        payload: { item: ItemRevision } & SelectedItem,
        callback?: ActionCallback<ReturnType<typeof itemRestoreSuccess> | ReturnType<typeof itemRestoreFailure>>
    ) => pipe(withCacheBlock, withCallback(callback))({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemRestoreFailure = createOptimisticAction(
    'restore item failure',
    (payload: SelectedItem, error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Restoring item failed`,
                error,
            })
        )({ payload, error }),
    ({ payload }) => getItemActionId(payload)
);

export const itemRestoreSuccess = createOptimisticAction(
    'restore item success',
    (payload: SelectedItem) =>
        withNotification({
            type: 'success',
            text: c('Info').t`Item restored`,
        })({ payload }),
    ({ payload }) => getItemActionId(payload)
);

export const itemUsed = createAction('item used', (payload: SelectedItem) => ({ payload }));
export const itemLastUseTimeUpdated = createAction(
    'item lastUseTime updated',
    (payload: { shareId: string; itemId: string; lastUseTime: number }) => ({ payload })
);

export const itemsRequested = createAction('items requested', (shareId: string) =>
    pipe(
        withCacheBlock,
        withRequest({
            id: requests.items(),
            type: 'start',
        })
    )({ payload: { shareId } })
);

export const itemsRequestSuccess = createAction(
    'items request success',
    (payload: { shareId: string; items: ItemRevision[] }) =>
        withRequest({
            id: requests.items(),
            type: 'success',
        })({ payload })
);

export const itemsRequestFailure = createAction('items request failure', (error: unknown) =>
    pipe(
        withCacheBlock,
        withRequest({
            id: requests.items(),
            type: 'failure',
        })
    )({ payload: {}, error })
);
