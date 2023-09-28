import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { PendingInvite } from '@proton/pass/types/data/invites';
import type { InviteCreateIntent, InviteResendIntent } from '@proton/pass/types/data/invites.dto';
import { pipe } from '@proton/pass/utils/fp';

import type { InviteState } from '../../reducers/invites';
import withCacheBlock from '../with-cache-block';
import withNotification from '../with-notification';
import { withRequestFailure, withRequestStart, withRequestSuccess } from '../with-request';

export const syncInvites = createAction<InviteState>('invites::sync');

export const inviteCreationIntent = createAction(
    'invite::create::intent',
    withRequestStart((payload: InviteCreateIntent) => withCacheBlock({ payload }))
);

export const inviteCreationSuccess = createAction(
    'invite::create::success',
    withRequestSuccess((shareId: string, invites: PendingInvite[]) => ({ payload: { shareId, invites } }))
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
