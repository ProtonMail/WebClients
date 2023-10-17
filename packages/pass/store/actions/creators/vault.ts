import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { vaultCreate, vaultDelete, vaultEdit } from '@proton/pass/store/actions/requests';
import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import type { ActionCallback } from '@proton/pass/store/actions/with-callback';
import withCallback from '@proton/pass/store/actions/with-callback';
import withNotification from '@proton/pass/store/actions/with-notification';
import withRequest, {
    withRequestFailure,
    withRequestStart,
    withRequestSuccess,
} from '@proton/pass/store/actions/with-request';
import { createOptimisticAction } from '@proton/pass/store/optimistic/action/create-optimistic-action';
import type { ItemRevision, MaybeNull, Share, ShareContent, ShareType } from '@proton/pass/types';
import type { VaultTransferOwnerIntent } from '@proton/pass/types/data/vault.dto';
import { pipe } from '@proton/pass/utils/fp/pipe';

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
                data: { shareId: payload.share.shareId },
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

export const vaultTransferOwnerIntent = createAction(
    'share::ownership::transfer::intent',
    withRequestStart((payload: VaultTransferOwnerIntent) => withCacheBlock({ payload }))
);

export const vaultTransferOwnershipSuccess = createAction(
    'share::ownership::transfer::success',
    withRequestSuccess((shareId: string, userShareId: string) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Ownership successfully transfered. You are no long the owner of this vault.`,
        })({ payload: { shareId, userShareId } })
    )
);

export const vaultTransferOwnershipFailure = createAction(
    'share::ownership::transfer::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to transfer this vault's ownership.`,
                error,
            })
        )({ payload: {} })
    )
);
