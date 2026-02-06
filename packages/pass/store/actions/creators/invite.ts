import { createAction } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import {
    inviteAddressesValidateRequest,
    inviteCreateRequest,
    inviteRecommendationsRequest,
    inviteRecommendationsSuggestedRequest,
    inviteRemoveRequest,
    inviteResendRequest,
    newUserInvitePromoteRequest,
    newUserInviteRemoveRequest,
} from '@proton/pass/store/actions/requests';
import type { InviteState } from '@proton/pass/store/reducers';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { InviteFormValues, InviteType } from '@proton/pass/types';
import type {
    GroupInviteAcceptSuccess,
    InviteAcceptIntent,
    InviteAcceptSuccess,
    InviteBatchCreateSuccess,
    InviteRecommendationsIntent,
    InviteRecommendationsOrganizationIntent,
    InviteRecommendationsOrganizationSuccess,
    InviteRecommendationsSuccess,
    InviteRecommendationsSuggestedIntent,
    InviteRecommendationsSuggestedSuccess,
    InviteRejectIntent,
    InviteRemoveIntent,
    InviteResendIntent,
    NewUserInvitePromoteIntent,
    NewUserInvitePromoteSuccess,
    NewUserInviteRemoveIntent,
} from '@proton/pass/types/data/invites.dto';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

export const syncInvites = createAction<{ type: InviteType; invites: InviteState }>('invites::sync');

export const inviteBatchCreateIntent = createAction('invite::batch::create::intent', (payload: InviteFormValues) =>
    withRequest({ status: 'start', id: inviteCreateRequest(uniqueId()) })({ payload })
);

export const inviteBatchCreateSuccess = createAction(
    'invite::batch::create::success',
    withRequestSuccess((payload: InviteBatchCreateSuccess) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').ngettext(
                    msgid`${payload.count} invite successfully sent`,
                    `${payload.count} invites successfully sent`,
                    payload.count
                ),
            })
        )({ payload })
    )
);

export const inviteBatchCreateFailure = createAction(
    'invite::batch::create::failure',
    withRequestFailure((error: unknown, count: number) =>
        withNotification({
            type: 'error',
            text: c('Error').ngettext(msgid`Cannot send invitation at the moment`, `Cannot send invitations at the moment`, count),
            error,
        })({ payload: {}, error })
    )
);

export const newUserInvitePromoteIntent = createAction('new-user-invite::promote::intent', (payload: NewUserInvitePromoteIntent) =>
    withRequest({ status: 'start', id: newUserInvitePromoteRequest(payload.newUserInviteId) })({ payload })
);

export const newUserInvitePromoteSuccess = createAction(
    'new-user-invite::promote::success',
    withRequestSuccess((payload: NewUserInvitePromoteSuccess) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Access successfully confirmed`,
            })
        )({ payload })
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

export const inviteAccept = requestActionsFactory<InviteAcceptIntent, InviteAcceptSuccess, void>('invite::accept')({
    key: prop('inviteToken'),
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Invitation could not be accepted`,
                error,
            })({ payload }),
    },
    success: { prepare: (payload) => withCache({ payload }) },
});

export const groupInviteAccept = requestActionsFactory<InviteAcceptIntent, GroupInviteAcceptSuccess, void>('invite::group::accept')({
    key: prop('inviteToken'),
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Invitation could not be accepted`,
                error,
            })({ payload }),
    },
    success: { prepare: (payload) => withCache({ payload }) },
});

export const inviteReject = requestActionsFactory<InviteRejectIntent, { inviteToken: string }>('invite::reject')({
    key: prop('inviteToken'),
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Invitation could not be rejected`,
                error,
            })({ payload }),
    },
    success: {
        prepare: (payload) => withCache({ payload }),
    },
});

export const groupInviteReject = requestActionsFactory<InviteRejectIntent, { inviteToken: string }>('invite::group::reject')({
    key: prop('inviteToken'),
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Invitation could not be rejected`,
                error,
            })({ payload }),
    },
    success: {
        prepare: (payload) => withCache({ payload }),
    },
});

export const inviteResendIntent = createAction('invite::resend::intent', (payload: InviteResendIntent) =>
    withRequest({ status: 'start', id: inviteResendRequest(payload.inviteId) })({ payload })
);

export const inviteResendSuccess = createAction(
    'invite::resend::success',
    withRequestSuccess((payload: InviteResendIntent) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Invite successfully resent`,
            })
        )({ payload })
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
    withRequest({ status: 'start', id: inviteRemoveRequest(payload.inviteId) })({ payload })
);

export const inviteRemoveSuccess = createAction(
    'invite::remove::success',
    withRequestSuccess((payload: InviteRemoveIntent) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Invite successfully removed`,
            })
        )({ payload })
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

export const newUserInviteRemoveIntent = createAction('new-user-invite::remove::intent', (payload: NewUserInviteRemoveIntent) =>
    withRequest({ status: 'start', id: newUserInviteRemoveRequest(payload.newUserInviteId) })({ payload })
);

export const newUserInviteRemoveSuccess = createAction(
    'new-user-invite::remove::success',
    withRequestSuccess((payload: NewUserInviteRemoveIntent) =>
        pipe(
            withCache,
            withNotification({
                type: 'info',
                text: c('Info').t`Invite successfully removed`,
            })
        )({ payload })
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

export const inviteRecommendationsIntent = createAction(
    'invite::recommendations::intent',
    (payload: InviteRecommendationsIntent, requestId: string) =>
        withRequest({ status: 'start', id: inviteRecommendationsRequest(requestId) })({ payload })
);

export const inviteRecommendationsSuccess = createAction(
    'invite::recommendations::success',
    withRequestSuccess((payload: InviteRecommendationsSuccess) => ({ payload }))
);

export const inviteRecommendationsFailure = createAction(
    'invite::recommendations::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Could not load recommendations at the moment.`,
            error,
        })({ payload: {} })
    )
);

export const inviteRecommendationsSuggestedIntent = createAction(
    'invite::recommendations::suggested::intent',
    (payload: InviteRecommendationsSuggestedIntent, requestId: string) =>
        withRequest({ status: 'start', id: inviteRecommendationsSuggestedRequest(requestId) })({ payload })
);

export const inviteRecommendationsSuggestedSuccess = createAction(
    'invite::recommendations::suggested::success',
    withRequestSuccess((payload: InviteRecommendationsSuggestedSuccess) => ({ payload }))
);

export const inviteRecommendationsSuggestedFailure = createAction(
    'invite::recommendations::suggested::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Could not load recommendations at the moment.`,
            error,
        })({ payload: {} })
    )
);

export const inviteRecommendationsOrganizationIntent = createAction(
    'invite::recommendations::organization::intent',
    (payload: InviteRecommendationsOrganizationIntent, requestId: string) =>
        withRequest({ status: 'start', id: inviteRecommendationsSuggestedRequest(requestId) })({ payload })
);

export const inviteRecommendationsOrganizationSuccess = createAction(
    'invite::recommendations::organization::success',
    withRequestSuccess((payload: InviteRecommendationsOrganizationSuccess) => ({ payload }))
);

export const inviteRecommendationsOrganizationFailure = createAction(
    'invite::recommendations::organization::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Could not load recommendations at the moment.`,
            error,
        })({ payload: {} })
    )
);

export const inviteAddressesValidateIntent = createAction(
    'invite::addresses::validate::intent',
    (payload: { shareId: string; emails: string[] }, requestId: string) =>
        withRequest({ status: 'start', id: inviteAddressesValidateRequest(requestId) })({ payload })
);

export const inviteAddressesValidateSuccess = createAction(
    'invite::addresses::validate::success',
    withRequestSuccess((payload: Record<string, boolean>) => ({ payload }))
);

export const inviteAddressesValidateFailure = createAction(
    'invite::addresses::validate::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Could not validate addresses at the moment.`,
            error,
        })({ payload: {} })
    )
);
