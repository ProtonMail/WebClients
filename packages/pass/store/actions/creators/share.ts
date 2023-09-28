import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { Share } from '@proton/pass/types';
import type { PendingInvite, ShareMember } from '@proton/pass/types/data/invites';
import type { ShareRemoveMemberAccessIntent } from '@proton/pass/types/data/shares.dto';
import { pipe } from '@proton/pass/utils/fp';
import { isVaultShare } from '@proton/pass/utils/pass/share';

import type { SynchronizationResult } from '../../sagas/workers/sync';
import withCacheBlock from '../with-cache-block';
import withNotification from '../with-notification';
import { withRequestFailure, withRequestStart, withRequestSuccess } from '../with-request';

export const shareEditSync = createAction('share edit sync', (payload: { id: string; share: Share }) => ({ payload }));

export const shareDeleteSync = createAction('share delete sync', (share: Share) =>
    withNotification({
        type: 'info',
        text: isVaultShare(share)
            ? c('Info').t`Vault "${share.content.name}" was disabled`
            : c('Info').t`An item previously shared with you was disabled`,
    })({ payload: { shareId: share.shareId } })
);

export const sharesSync = createAction('new shares sync', (payload: SynchronizationResult) => ({ payload }));

export const shareInvitesSync = createAction('share::invites::sync', (shareId: string, invites: PendingInvite[]) => ({
    payload: { shareId, invites },
}));

export const shareMembersSync = createAction('share::members::sync', (shareId: string, members: ShareMember[]) => ({
    payload: { shareId, members },
}));

export const shareRemoveMemberAccessIntent = createAction(
    'share::member::remove-access::intent',
    withRequestStart((payload: ShareRemoveMemberAccessIntent) => withCacheBlock({ payload }))
);

export const shareRemoveMemberAccessSuccess = createAction(
    'share::member::remove-access::success',
    withRequestSuccess((shareId: string, userShareId: string) =>
        withNotification({
            type: 'info',
            text: c('Info').t`User's access removed`,
        })({ payload: { shareId, userShareId } })
    )
);

export const shareRemoveMemberAccessFailure = createAction(
    'share::member::remove-access::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to remove user's access.`,
                error,
            })
        )({ payload: {} })
    )
);
