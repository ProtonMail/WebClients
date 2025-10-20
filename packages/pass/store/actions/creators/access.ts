import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { toShareAccessKey } from '@proton/pass/lib/access/access.utils';
import type { AccessKeys } from '@proton/pass/lib/access/types';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { shareEditMemberRoleRequest, shareLeaveRequest, shareRemoveMemberRequest } from '@proton/pass/store/actions/requests';
import type { AccessState } from '@proton/pass/store/reducers';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import { ShareType } from '@proton/pass/types';
import type { ShareEditMemberAccessIntent, ShareRemoveMemberAccessIntent } from '@proton/pass/types/data/access.dto';
import { pipe } from '@proton/pass/utils/fp/pipe';

export const shareRemoveMemberAccessIntent = createAction(
    'share::member::remove-access::intent',
    (payload: ShareRemoveMemberAccessIntent) =>
        withRequest({ status: 'start', id: shareRemoveMemberRequest(payload.userShareId) })({ payload })
);

export const shareRemoveMemberAccessSuccess = createAction(
    'share::member::remove-access::success',
    withRequestSuccess((payload: ShareRemoveMemberAccessIntent) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`User's access removed`,
            })
        )({ payload })
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

export const shareEditMemberAccessIntent = createAction('share::member::edit-access::intent', (payload: ShareEditMemberAccessIntent) =>
    withRequest({ status: 'start', id: shareEditMemberRoleRequest(payload.userShareId) })({ payload })
);

export const shareEditMemberAccessSuccess = createAction(
    'share::member::edit-access::success',
    withRequestSuccess((payload: ShareEditMemberAccessIntent) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`User's access successfully updated`,
            })
        )({ payload })
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

export const getShareAccessOptions = requestActionsFactory<AccessKeys, AccessState>('share::access-options')({
    key: toShareAccessKey,
    success: { config: { maxAge: 15, data: null, hot: true } },
    failure: {
        prepare: (error: unknown, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Could not resolve share members`,
                error,
            })({ payload, error }),
    },
});

export const shareLeaveIntent = createAction('share::leave::intent', (payload: { shareId: string; targetType: ShareType }) =>
    pipe(
        withRequest({ status: 'start', id: shareLeaveRequest(payload.shareId) }),
        withNotification({
            type: 'info',
            expiration: -1,
            loading: true,
            text: payload.targetType === ShareType.Vault ? c('Info').t`Leaving vault...` : c('Info').t`Leaving item...`,
        })
    )({ payload })
);

export const shareLeaveSuccess = createAction(
    'share::leave::success',
    withRequestSuccess((shareId: string, targetType: ShareType) =>
        withNotification({
            type: 'info',
            text: targetType === ShareType.Vault ? c('Info').t`Successfully left the vault` : c('Info').t`Successfully left the item`,
        })({ payload: { shareId } })
    )
);

export const shareLeaveFailure = createAction(
    'share::leave::failure',
    withRequestFailure((targetType: ShareType, error: unknown) =>
        withNotification({
            type: 'error',
            text: targetType === ShareType.Vault ? c('Error').t`Could not leave vault.` : c('Error').t`Could not leave item.`,
            error,
        })({ payload: {}, error })
    )
);
