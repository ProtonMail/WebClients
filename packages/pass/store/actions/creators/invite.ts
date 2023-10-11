import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import withNotification from '@proton/pass/store/actions/with-notification';
import { withRequestFailure, withRequestStart, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { InviteState } from '@proton/pass/store/reducers';
import type { ItemRevision, Share, ShareType } from '@proton/pass/types';
import type {
    InviteAcceptIntent,
    InviteCreateIntent,
    InviteRejectIntent,
    InviteRemoveIntent,
    InviteResendIntent,
} from '@proton/pass/types/data/invites.dto';
import { pipe } from '@proton/pass/utils/fp';

export const syncInvites = createAction<InviteState>('invites::sync');

export const inviteCreationIntent = createAction(
    'invite::create::intent',
    withRequestStart((payload: InviteCreateIntent) => withCacheBlock({ payload }))
);

export const inviteCreationSuccess = createAction(
    'invite::create::success',
    withRequestSuccess((shareId: string) =>
        withNotification({
            type: 'info',
            text: c('Error').t`Invite successfully sent`,
        })({ payload: { shareId } })
    )
);

export const inviteCreationFailure = createAction(
    'invite::create::failure',
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

export const inviteAcceptIntent = createAction(
    'invite::accept::intent',
    withRequestStart((payload: Omit<InviteAcceptIntent, 'inviteKeys'>) => withCacheBlock({ payload }))
);

export const inviteAcceptSuccess = createAction(
    'invite::accept::success',
    withRequestSuccess((token: string, share: Share<ShareType.Vault>, items: ItemRevision[]) => ({
        payload: { share, items, token },
    }))
);

export const inviteAcceptFailure = createAction(
    'invite::accept::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Invitation could not be accepted`,
                error,
            })
        )({ payload: {} })
    )
);

export const inviteRejectIntent = createAction(
    'invite::reject::intent',
    withRequestStart((payload: InviteRejectIntent) => withCacheBlock({ payload }))
);

export const inviteRejectSuccess = createAction(
    'invite::reject::success',
    withRequestSuccess((token: string) => ({ payload: { token } }))
);

export const inviteRejectFailure = createAction(
    'invite::reject::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Invitation could not be rejected`,
                error,
            })
        )({ payload: {} })
    )
);

export const inviteResendIntent = createAction(
    'invite::resend::intent',
    withRequestStart((payload: InviteResendIntent) => withCacheBlock({ payload }))
);

export const inviteResendSuccess = createAction(
    'invite::resend::success',
    withRequestSuccess((shareId: string, inviteId: string) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Invite successfully resent`,
        })({ payload: { shareId, inviteId } })
    )
);

export const inviteResendFailure = createAction(
    'invite::resend::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Failed resending invite.`,
                error,
            })
        )({ payload: {} })
    )
);

export const inviteRemoveIntent = createAction(
    'invite::remove::intent',
    withRequestStart((payload: InviteRemoveIntent) => withCacheBlock({ payload }))
);

export const inviteRemoveSuccess = createAction(
    'invite::remove::success',
    withRequestSuccess((shareId: string, inviteId: string) =>
        withNotification({
            type: 'info',
            text: c('Info').t`Invite successfully removed`,
        })({ payload: { shareId, inviteId } })
    )
);

export const inviteRemoveFailure = createAction(
    'invite::remove::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Failed removing the invite.`,
                error,
            })
        )({ payload: {} })
    )
);
