import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { InviteData } from '@proton/pass/lib/invites/invite.requests';
import {
    inviteAcceptRequest,
    inviteCreateRequest,
    inviteRejectRequest,
    inviteRemoveRequest,
    inviteResendRequest,
    newUserInvitePromoteRequest,
    newUserInviteRemoveRequest,
} from '@proton/pass/store/actions/requests';
import { withCache } from '@proton/pass/store/actions/with-cache';
import withNotification from '@proton/pass/store/actions/with-notification';
import withRequest, { withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { InviteState } from '@proton/pass/store/reducers';
import type { InviteFormValues, ItemRevision, Share, ShareType } from '@proton/pass/types';
import type {
    InviteAcceptIntent,
    InviteCreateSuccess,
    InviteRejectIntent,
    InviteRemoveIntent,
    InviteResendIntent,
    NewUserInvitePromoteIntent,
} from '@proton/pass/types/data/invites.dto';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

export const syncInvites = createAction<InviteState>('invites::sync');

export const inviteCreationIntent = createAction('invite::create::intent', (payload: InviteFormValues) =>
    withRequest({ type: 'start', id: inviteCreateRequest(uniqueId()) })({ payload })
);

export const inviteCreationSuccess = createAction(
    'invite::create::success',
    withRequestSuccess(
        (payload: InviteCreateSuccess) =>
            pipe(
                withCache,
                withNotification({
                    type: 'info',
                    text: c('Info').t`Invite successfully sent`,
                })
            )({ payload }),
        { data: ({ shareId }) => ({ shareId }) }
    )
);

export const inviteCreationFailure = createAction(
    'invite::create::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Cannot send invitation to this address at the moment`,
            error,
        })({ payload: {}, error })
    )
);

export const newUserInvitePromoteIntent = createAction(
    'new-user-invite::promote::intent',
    (payload: NewUserInvitePromoteIntent) =>
        withRequest({ type: 'start', id: newUserInvitePromoteRequest(payload.newUserInviteId) })({ payload })
);

export const newUserInvitePromoteSuccess = createAction(
    'new-user-invite::promote::success',
    withRequestSuccess((shareId: string, shareInvites: InviteData) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Access successfully confirmed`,
            })
        )({ payload: { shareId, ...shareInvites } })
    )
);

export const newUserInvitePromoteFailure = createAction(
    'new-user-invite::promote::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Could not confirm this invite at the moment`,
            error,
        })({ payload: {}, error })
    )
);

export const inviteAcceptIntent = createAction(
    'invite::accept::intent',
    (payload: Omit<InviteAcceptIntent, 'inviteKeys'>) =>
        withRequest({ type: 'start', id: inviteAcceptRequest(payload.inviteToken) })({ payload })
);

export const inviteAcceptSuccess = createAction(
    'invite::accept::success',
    withRequestSuccess((token: string, share: Share<ShareType.Vault>, items: ItemRevision[]) =>
        withCache({
            payload: { share, items, token },
        })
    )
);

export const inviteAcceptFailure = createAction(
    'invite::accept::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Invitation could not be accepted`,
            error,
        })({ payload: {} })
    )
);

export const inviteRejectIntent = createAction('invite::reject::intent', (payload: InviteRejectIntent) =>
    withRequest({ type: 'start', id: inviteRejectRequest(payload.inviteToken) })({ payload })
);

export const inviteRejectSuccess = createAction(
    'invite::reject::success',
    withRequestSuccess((token: string) => withCache({ payload: { token } }))
);

export const inviteRejectFailure = createAction(
    'invite::reject::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Invitation could not be rejected`,
            error,
        })({ payload: {} })
    )
);

export const inviteResendIntent = createAction('invite::resend::intent', (payload: InviteResendIntent) =>
    withRequest({ type: 'start', id: inviteResendRequest(payload.inviteId) })({ payload })
);

export const inviteResendSuccess = createAction(
    'invite::resend::success',
    withRequestSuccess((shareId: string, inviteId: string) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Invite successfully resent`,
            })
        )({ payload: { shareId, inviteId } })
    )
);

export const inviteResendFailure = createAction(
    'invite::resend::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed resending invite.`,
            error,
        })({ payload: {} })
    )
);

export const inviteRemoveIntent = createAction('invite::remove::intent', (payload: InviteRemoveIntent) =>
    withRequest({ type: 'start', id: inviteRemoveRequest(payload.inviteId) })({ payload })
);

export const inviteRemoveSuccess = createAction(
    'invite::remove::success',
    withRequestSuccess((shareId: string, inviteId: string) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Invite successfully removed`,
            })
        )({ payload: { shareId, inviteId } })
    )
);

export const inviteRemoveFailure = createAction(
    'invite::remove::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed removing the invite.`,
            error,
        })({ payload: {} })
    )
);

export const newUserInviteRemoveIntent = createAction(
    'new-user-invite::remove::intent',
    (payload: NewUserInvitePromoteIntent) =>
        withRequest({ type: 'start', id: newUserInviteRemoveRequest(payload.newUserInviteId) })({ payload })
);

export const newUserInviteRemoveSuccess = createAction(
    'new-user-invite::remove::success',
    withRequestSuccess((shareId: string, newUserInviteId: string) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Invite successfully removed`,
            })
        )({ payload: { shareId, newUserInviteId } })
    )
);

export const newUserInviteRemoveFailure = createAction(
    'new-user-invite::remove::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Failed removing the invite.`,
            error,
        })({ payload: {} })
    )
);
