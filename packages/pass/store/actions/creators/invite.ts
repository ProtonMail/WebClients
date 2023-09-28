import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type VaultInviteCreateRequest } from '@proton/pass/types';
import type { PendingInvite, ShareMember } from '@proton/pass/types/data/invites';
import { pipe } from '@proton/pass/utils/fp';

import withCacheBlock from '../with-cache-block';
import withNotification from '../with-notification';
import { withRequestFailure, withRequestStart, withRequestSuccess } from '../with-request';

export const vaultInviteCreationIntent = createAction(
    'vault::invite::intent',
    withRequestStart((payload: VaultInviteCreateRequest) => withCacheBlock({ payload }))
);

export const vaultInviteCreationSuccess = createAction(
    'vault::invite::success',
    withRequestSuccess((shareId: string, invites: PendingInvite[]) => ({ payload: { shareId, invites } }))
);

export const vaultInviteCreationFailure = createAction(
    'vault::invite::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Invite creation failed.`,
                error,
            })
        )({ payload: {} })
    )
);

export const syncShareInvites = createAction(
    'share::invites::pending',
    (shareId: string, invites: PendingInvite[]) => ({
        payload: { shareId, invites },
    })
);

export const syncShareMembers = createAction('share::members', (shareId: string, members: ShareMember[]) => ({
    payload: { shareId, members },
}));

export const vaultRemoveAccessIntent = createAction(
    'vault::remove-access::intent',
    withRequestStart((payload: { shareId: string; userShareId: string }) => ({ payload }))
);

export const vaultRemoveAccessSuccess = createAction(
    'vault::remove-access::success',
    withRequestSuccess(() => ({ payload: {} }))
);

export const vaultRemoveAccessFailure = createAction(
    'vault::remove-access::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to remove user's access.`,
                error,
            })
        )({ payload: {} })
    )
);
