import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { type VaultInviteCreateRequest } from '@proton/pass/types';
import { type PendingInvite } from '@proton/pass/types/data/invites';
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
