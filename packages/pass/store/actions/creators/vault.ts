import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ExtensionEndpoint, ItemRevision, MaybeNull, Share, ShareContent, ShareType } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';

import { createOptimisticAction } from '../../optimistic/action/create-optimistic-action';
import { vaultCreate, vaultDelete, vaultEdit, vaultSetPrimary } from '../requests';
import withCacheBlock from '../with-cache-block';
import type { ActionCallback } from '../with-callback';
import withCallback from '../with-callback';
import withNotification from '../with-notification';
import withRequest from '../with-request';

export const vaultCreationIntent = createOptimisticAction(
    'vault creation intent',
    (
        payload: { id: string; content: ShareContent<ShareType.Vault> },
        callback?: ActionCallback<ReturnType<typeof vaultCreationSuccess> | ReturnType<typeof vaultCreationFailure>>
    ) =>
        pipe(
            withCacheBlock,
            withRequest({
                type: 'start',
                id: vaultCreate(payload.id),
            }),
            withCallback(callback)
        )({ payload }),
    ({ payload }) => payload.id
);

export const vaultCreationFailure = createOptimisticAction(
    'vault creation failure',
    (payload: { id: string; content: ShareContent<ShareType.Vault> }, error: unknown) =>
        pipe(
            withCacheBlock,
            withRequest({
                type: 'failure',
                id: vaultCreate(payload.id),
            }),
            withNotification({
                type: 'error',
                text: c('Error').t`Vault "${payload.content.name}" creation failed`,
                error,
            })
        )({ payload, error }),
    ({ payload }) => payload.id
);

/**
 * The payload on a vault creation success contains the
 * full share object as the payload will be intercepted
 * by the events.saga to create the appropriate event
 * loop channel
 */
export const vaultCreationSuccess = createOptimisticAction(
    'vault creation success',
    (payload: { id: string; share: Share<ShareType.Vault> }) =>
        pipe(
            withRequest({
                type: 'success',
                id: vaultCreate(payload.id),
            }),
            withNotification({
                type: 'success',
                text: c('Info').t`Vault "${payload.share.content.name}" successfully created`,
            })
        )({ payload }),
    ({ payload }) => payload.id
);

export const vaultEditIntent = createOptimisticAction(
    'vault edit intent',
    (payload: { id: string; content: ShareContent<ShareType.Vault> }) =>
        pipe(
            withCacheBlock,
            withRequest({
                type: 'start',
                id: vaultEdit(payload.id),
            })
        )({ payload }),
    ({ payload }) => payload.id
);

export const vaultEditFailure = createOptimisticAction(
    'vault edit failure',
    (payload: { id: string; content: ShareContent<ShareType.Vault> }, error: unknown) =>
        pipe(
            withCacheBlock,
            withRequest({
                type: 'failure',
                id: vaultEdit(payload.id),
            }),
            withNotification({
                type: 'error',
                text: c('Error').t`Updating vault "${payload.content.name}" failed`,
                error,
            })
        )({ payload, error }),
    ({ payload }) => payload.id
);

export const vaultEditSuccess = createOptimisticAction(
    'vault edit success',
    (payload: { id: string; share: Share<ShareType.Vault> }) =>
        pipe(
            withRequest({
                type: 'success',
                id: vaultEdit(payload.id),
            }),
            withNotification({
                type: 'info',
                text: c('Info').t`Vault "${payload.share.content.name}" successfully updated`,
            })
        )({ payload }),
    ({ payload }) => payload.id
);

export const vaultDeleteIntent = createOptimisticAction(
    'vault delete intent',
    (payload: { id: string; content: ShareContent<ShareType.Vault>; destinationShareId: MaybeNull<string> }) =>
        pipe(
            withCacheBlock,
            withRequest({
                type: 'start',
                id: vaultDelete(payload.id),
            })
        )({ payload }),
    ({ payload }) => payload.id
);

export const vaultDeleteFailure = createOptimisticAction(
    'vault delete failure',
    (payload: { id: string; content: ShareContent<ShareType.Vault> }, error: unknown) =>
        pipe(
            withCacheBlock,
            withRequest({
                type: 'failure',
                id: vaultDelete(payload.id),
            }),
            withNotification({
                type: 'error',
                text: c('Error').t`Deleting vault "${payload.content.name}" failed`,
                error,
            })
        )({ payload, error }),
    ({ payload }) => payload.id
);

export const vaultDeleteSuccess = createOptimisticAction(
    'vault delete success',
    (payload: { id: string; content: ShareContent<ShareType.Vault>; movedItems: ItemRevision[] }) =>
        pipe(
            withRequest({
                type: 'success',
                id: vaultDelete(payload.id),
            }),
            withNotification({
                type: 'info',
                text: c('Info').t`Vault "${payload.content.name}" successfully deleted`,
            })
        )({ payload }),
    ({ payload }) => payload.id
);

export const vaultSetPrimaryIntent = createOptimisticAction(
    'vault set primary intent',
    (payload: { id: string; name: string }) =>
        pipe(
            withCacheBlock,
            withRequest({
                type: 'start',
                id: vaultSetPrimary(payload.id),
            })
        )({ payload }),
    ({ payload }) => payload.id
);

export const vaultSetPrimaryFailure = createOptimisticAction(
    'vault set primary failure',
    (payload: { id: string; name: string }, error: unknown, receiver?: ExtensionEndpoint) =>
        pipe(
            withCacheBlock,
            withRequest({
                type: 'failure',
                id: vaultSetPrimary(payload.id),
            }),
            withNotification({
                type: 'error',
                text: c('Error').t`Setting "${payload.name}" as primary vault failed`,
                receiver,
                error,
            })
        )({ payload, error }),
    ({ payload }) => payload.id
);

export const vaultSetPrimarySuccess = createOptimisticAction(
    'vault set primary success',
    (payload: { id: string; name: string }, receiver?: ExtensionEndpoint) =>
        pipe(
            withRequest({
                type: 'success',
                id: vaultSetPrimary(payload.id),
            }),
            withNotification({
                type: 'info',
                text: c('Info').t`"${payload.name}" set as primary vault`,
                receiver,
            })
        )({ payload }),
    ({ payload }) => payload.id
);

export const vaultSetPrimarySync = createAction('vault set primary sync', (payload: { id: string }) => ({ payload }));
