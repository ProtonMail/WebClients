import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import type { ActionCallback } from '@proton/pass/store/actions/with-callback';
import withCallback from '@proton/pass/store/actions/with-callback';
import withNotification from '@proton/pass/store/actions/with-notification';
import withRequest, { withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { ItemRevision, Share, ShareContent, ShareType } from '@proton/pass/types';
import type { VaultTransferOwnerIntent } from '@proton/pass/types/data/vault.dto';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import {
    vaultCreateRequest,
    vaultDeleteRequest,
    vaultEditRequest,
    vaultMoveAllItemsRequest,
    vaultTransferOwnerRequest,
} from '../requests';

export const vaultCreationIntent = createAction(
    'vault::creation::intent',

    (
        payload: { content: ShareContent<ShareType.Vault> },
        callback?: ActionCallback<ReturnType<typeof vaultCreationSuccess> | ReturnType<typeof vaultCreationFailure>>
    ) =>
        pipe(
            withRequest({ type: 'start', id: vaultCreateRequest(uniqueId()) }),
            withCacheBlock,
            withCallback(callback)
        )({ payload })
);

export const vaultCreationFailure = createAction(
    'vault::creation::failure',
    withRequestFailure((payload: { content: ShareContent<ShareType.Vault> }, error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Vault "${payload.content.name}" creation failed`,
                error,
            })
        )({ payload, error })
    )
);

/* This action will be intercepted by the events.saga to create
 * the appropriate event loop channel upon successful creation */
export const vaultCreationSuccess = createAction(
    'vault::creation::success',
    withRequestSuccess(
        (payload: { share: Share<ShareType.Vault> }) =>
            withNotification({
                type: 'success',
                text: c('Info').t`Vault "${payload.share.content.name}" successfully created`,
            })({ payload }),
        { data: ({ share }) => ({ shareId: share.shareId }) }
    )
);

export const vaultEditIntent = createAction(
    'vault::edit::intent',
    (payload: { shareId: string; content: ShareContent<ShareType.Vault> }) =>
        pipe(withRequest({ type: 'start', id: vaultEditRequest(payload.shareId) }), withCacheBlock)({ payload })
);

export const vaultEditFailure = createAction(
    'vault::edit::failure',
    withRequestFailure((payload: { shareId: string; content: ShareContent<ShareType.Vault> }, error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Updating vault "${payload.content.name}" failed`,
                error,
            })
        )({ payload, error })
    )
);

export const vaultEditSuccess = createAction(
    'vault::edit::success',
    withRequestSuccess((payload: { share: Share<ShareType.Vault> }) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Vault "${payload.share.content.name}" successfully updated`,
        })({ payload })
    )
);

export const vaultDeleteIntent = createAction(
    'vault::delete::intent',

    (payload: { shareId: string; content: ShareContent<ShareType.Vault> }) =>
        pipe(
            withRequest({ type: 'start', id: vaultDeleteRequest(payload.shareId) }),
            withCacheBlock,
            withNotification({
                type: 'info',
                loading: true,
                text: c('Info').t`Deleting "${payload.content.name}"`,
            })
        )({ payload })
);

export const vaultDeleteFailure = createAction(
    'vault::delete::failure',
    withRequestFailure((payload: { shareId: string; content: ShareContent<ShareType.Vault> }, error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Deleting vault "${payload.content.name}" failed`,
                error,
            })
        )({ payload, error })
    )
);

export const vaultDeleteSuccess = createAction(
    'vault::delete::success',
    withRequestSuccess((payload: { shareId: string; content: ShareContent<ShareType.Vault> }) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Vault "${payload.content.name}" successfully deleted`,
        })({ payload })
    )
);

export const vaultMoveAllItemsIntent = createAction(
    'vault::move::all::items::intent',
    (payload: { shareId: string; content: ShareContent<ShareType.Vault>; destinationShareId: string }) =>
        pipe(
            withRequest({ type: 'start', id: vaultMoveAllItemsRequest(payload.shareId) }),
            withCacheBlock,
            withNotification({
                expiration: -1,
                type: 'info',
                loading: true,
                text: c('Info').t`Moving all items from "${payload.content.name}"`,
            })
        )({ payload })
);

export const vaultMoveAllItemsSuccess = createAction(
    'vault::move::all::items::success',
    withRequestSuccess(
        (payload: { shareId: string; content: ShareContent<ShareType.Vault>; movedItems: ItemRevision[] }) =>
            withNotification({
                type: 'info',
                text: c('Info').t`All items from "${payload.content.name}" successfully moved`,
            })({ payload })
    )
);

export const vaultMoveAllItemsFailure = createAction(
    'vault::move::all::items::failure',
    withRequestFailure((payload: { shareId: string; content: ShareContent<ShareType.Vault> }, error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to move all items from "${payload.content.name}"`,
                error,
            })
        )({ payload, error })
    )
);

export const vaultTransferOwnerIntent = createAction(
    'share::ownership::transfer::intent',
    (payload: VaultTransferOwnerIntent) =>
        pipe(
            withRequest({ type: 'start', id: vaultTransferOwnerRequest(payload.userShareId) }),
            withCacheBlock
        )({ payload })
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
