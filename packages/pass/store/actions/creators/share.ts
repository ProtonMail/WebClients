import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import {
    shareAccessOptionsRequest,
    shareEditMemberRoleRequest,
    shareLeaveRequest,
    shareRemoveMemberRequest,
} from '@proton/pass/store/actions/requests';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import type { SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
import type { Share, ShareAccessKeys, ShareRole } from '@proton/pass/types';
import type {
    ShareAccessOptions,
    ShareEditMemberAccessIntent,
    ShareRemoveMemberAccessIntent,
} from '@proton/pass/types/data/shares.dto';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const shareEditSync = createAction('share::edit:sync', (payload: { id: string; share: Share }) =>
    withCache({ payload })
);

export const shareDeleteSync = createAction('share::delete::sync', (share: Share) =>
    pipe(
        withCache,
        withNotification({
            type: 'info',
            text: isVaultShare(share)
                ? c('Info').t`Vault "${share.content.name}" was removed`
                : c('Info').t`An item previously shared with you was removed`,
        })
    )({ payload: { shareId: share.shareId } })
);

export const sharesSync = createAction('shares::sync', (payload: SynchronizationResult) => withCache({ payload }));

export const shareRemoveMemberAccessIntent = createAction(
    'share::member::remove-access::intent',
    (payload: ShareRemoveMemberAccessIntent) =>
        withRequest({ status: 'start', id: shareRemoveMemberRequest(payload.userShareId) })({ payload })
);

export const shareRemoveMemberAccessSuccess = createAction(
    'share::member::remove-access::success',
    withRequestSuccess((shareId: string, userShareId: string) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`User's access removed`,
            })
        )({ payload: { shareId, userShareId } })
    )
);

export const shareRemoveMemberAccessFailure = createAction(
    'share::member::remove-access::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to remove user's access.`,
            error,
        })({ payload: {} })
    )
);

export const shareEditMemberAccessIntent = createAction(
    'share::member::edit-access::intent',
    (payload: ShareEditMemberAccessIntent) =>
        withRequest({ status: 'start', id: shareEditMemberRoleRequest(payload.userShareId) })({ payload })
);

export const shareEditMemberAccessSuccess = createAction(
    'share::member::edit-access::success',
    withRequestSuccess((shareId: string, userShareId: string, shareRoleId: ShareRole) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`User's access sucessfuly updated`,
            })
        )({ payload: { shareId, userShareId, shareRoleId } })
    )
);

export const shareEditMemberAccessFailure = createAction(
    'share::member:edit-access::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed to edit user's access.`,
            error,
        })({ payload: {} })
    )
);

export const shareLeaveIntent = createAction('share::leave::intent', (payload: { shareId: string }) =>
    pipe(
        withRequest({ status: 'start', id: shareLeaveRequest(payload.shareId) }),
        withNotification({
            type: 'info',
            expiration: -1,
            loading: true,
            text: c('Info').t`Leaving vault...`,
        })
    )({ payload })
);

export const shareLeaveSuccess = createAction(
    'share::leave::success',
    withRequestSuccess((shareId: string) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Successfully left the vault`,
        })({ payload: { shareId } })
    )
);

export const shareLeaveFailure = createAction(
    'share::leave::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Could not leave vault.`,
            error,
        })({ payload: {}, error })
    )
);

export const getShareAccessOptionsIntent = createAction('share::access-options::intent', (shareId: string) =>
    withRequest({ status: 'start', id: shareAccessOptionsRequest(shareId) })({ payload: { shareId } })
);

export const getShareAccessOptionsSuccess = createAction(
    'share::access-options::success',
    withRequestSuccess((payload: ShareAccessOptions) => ({ payload }), { maxAge: 15 })
);

export const getShareAccessOptionsFailure = createAction(
    'share::access-options::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Could not resolve share members`,
            error,
        })({ payload: {}, error })
    )
);

export const shareAccessChange = createAction('share::access::change', (payload: Pick<Share, ShareAccessKeys>) =>
    withCache({ payload })
);
