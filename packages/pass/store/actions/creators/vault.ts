import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import type { ActionCallback } from '@proton/pass/store/actions/with-callback';
import withCallback from '@proton/pass/store/actions/with-callback';
import withNotification from '@proton/pass/store/actions/with-notification';
import { withRequestFailure, withRequestStart, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { ItemRevision, MaybeNull, Share, ShareContent, ShareType } from '@proton/pass/types';
import type { VaultTransferOwnerIntent } from '@proton/pass/types/data/vault.dto';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const vaultCreationIntent = createAction(
    'vault::creation::intent',
    withRequestStart(
        (
            payload: { content: ShareContent<ShareType.Vault> },
            callback?: ActionCallback<ReturnType<typeof vaultCreationSuccess> | ReturnType<typeof vaultCreationFailure>>
        ) => pipe(withCacheBlock, withCallback(callback))({ payload })
    )
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
    withRequestStart((payload: { shareId: string; content: ShareContent<ShareType.Vault> }) =>
        withCacheBlock({ payload })
    )
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
    withRequestStart(
        (payload: { shareId: string; content: ShareContent<ShareType.Vault>; destinationShareId: MaybeNull<string> }) =>
            pipe(
                withCacheBlock,
                withNotification({
                    type: 'info',
                    loading: true,
                    text: c('Info').t`Deleting "${payload.content.name}"`,
                })
            )({ payload })
    )
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
    withRequestSuccess(
        (payload: { shareId: string; content: ShareContent<ShareType.Vault>; movedItems: ItemRevision[] }) =>
            withNotification({
                type: 'info',
                text: c('Info').t`Vault "${payload.content.name}" successfully deleted`,
            })({ payload })
    )
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
