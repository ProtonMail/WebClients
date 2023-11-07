import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import withNotification from '@proton/pass/store/actions/with-notification';
import withRequest, { withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { SynchronizationResult } from '@proton/pass/store/sagas/workers/sync';
import type { Share, ShareAccessKeys, ShareRole } from '@proton/pass/types';
import type {
    ShareAccessOptions,
    ShareEditMemberAccessIntent,
    ShareRemoveMemberAccessIntent,
} from '@proton/pass/types/data/shares.dto';
import { pipe } from '@proton/pass/utils/fp/pipe';

import {
    shareAccessOptionsRequest,
    shareEditMemberRoleRequest,
    shareLeaveRequest,
    shareRemoveMemberRequest,
} from '../requests';

export const shareEditSync = createAction('share::edit:sync', (payload: { id: string; share: Share }) => ({ payload }));

export const shareDeleteSync = createAction('share::delete::sync', (share: Share) =>
    withNotification({
        type: 'info',
        text: isVaultShare(share)
            ? c('Info').t`Vault "${share.content.name}" was disabled`
            : c('Info').t`An item previously shared with you was disabled`,
    })({ payload: { shareId: share.shareId } })
);

export const sharesSync = createAction('shares::sync', (payload: SynchronizationResult) => ({ payload }));

export const shareRemoveMemberAccessIntent = createAction(
    'share::member::remove-access::intent',
    (payload: ShareRemoveMemberAccessIntent) =>
        pipe(
            withRequest({ type: 'start', id: shareRemoveMemberRequest(payload.userShareId) }),
            withCacheBlock
        )({ payload })
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

export const shareEditMemberAccessIntent = createAction(
    'share::member::edit-access::intent',
    (payload: ShareEditMemberAccessIntent) =>
        pipe(
            withRequest({ type: 'start', id: shareEditMemberRoleRequest(payload.userShareId) }),
            withCacheBlock
        )({ payload })
);

export const shareEditMemberAccessSuccess = createAction(
    'share::member::edit-access::success',
    withRequestSuccess((shareId: string, userShareId: string, shareRoleId: ShareRole) =>
        withNotification({
            type: 'info',
            text: c('Info').t`User's access sucessfuly updated`,
        })({ payload: { shareId, userShareId, shareRoleId } })
    )
);

export const shareEditMemberAccessFailure = createAction(
    'share::member:edit-access::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to edit user's access.`,
                error,
            })
        )({ payload: {} })
    )
);

export const shareLeaveIntent = createAction('share::leave::intent', (payload: { shareId: string }) =>
    pipe(
        withRequest({ type: 'start', id: shareLeaveRequest(payload.shareId) }),
        withNotification({
            type: 'info',
            expiration: -1,
            loading: true,
            text: c('Info').t`Leaving vault...`,
        }),
        withCacheBlock
    )({ payload })
);

export const shareLeaveSuccess = createAction(
    'share::leave::success',
    withRequestSuccess((shareId: string) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'info',
                text: c('Info').t`Successfully left the vault`,
            })
        )({ payload: { shareId } })
    )
);

export const shareLeaveFailure = createAction(
    'share::leave::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Could not leave vault.`,
                error,
            })
        )({ payload: {}, error })
    )
);

export const getShareAccessOptionsIntent = createAction('share::access-options::intent', (shareId: string) =>
    pipe(
        withRequest({ type: 'start', id: shareAccessOptionsRequest(shareId) }),
        withCacheBlock
    )({ payload: { shareId } })
);

export const getShareAccessOptionsSuccess = createAction(
    'share::access-options::success',
    withRequestSuccess((payload: ShareAccessOptions) => ({ payload }), { maxAge: 15 })
);

export const getShareAccessOptionsFailure = createAction(
    'share::access-options::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({ type: 'error', text: c('Error').t`Could not resolve share members`, error })
        )({ payload: {}, error })
    )
);

export const shareAccessChange = createAction('share::access::change', (payload: Pick<Share, ShareAccessKeys>) => ({
    payload,
}));
