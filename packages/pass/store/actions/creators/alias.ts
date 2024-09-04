import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { ALIAS_DETAILS_MAX_AGE, ALIAS_OPTIONS_MAX_AGE } from '@proton/pass/constants';
import { isAliasDisabled } from '@proton/pass/lib/items/item.predicates';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { type ActionCallback, withCallback } from '@proton/pass/store/actions/enhancers/callback';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import {
    aliasDetailsRequest,
    aliasOptionsRequest,
    aliasSyncEnableRequest,
    aliasSyncPendingRequest,
    aliasSyncStatusRequest,
    aliasSyncToggleStatusRequest,
} from '@proton/pass/store/actions/requests';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type {
    AliasMailbox,
    AliasOptions,
    AliasToggleStatusDTO,
    ItemRevision,
    SelectedItem,
    ShareId,
    SlSyncStatusOutput,
} from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';

export const getAliasOptionsIntent = createAction(
    'alias::options::get::intent',
    (
        payload: { shareId: string },
        callback?: ActionCallback<ReturnType<typeof getAliasOptionsSuccess> | ReturnType<typeof getAliasOptionsFailure>>
    ) =>
        pipe(
            withRequest({ status: 'start', id: aliasOptionsRequest(payload.shareId) }),
            withCallback(callback)
        )({ payload })
);

export const getAliasOptionsSuccess = createAction(
    'alias::options::get::success',
    withRequestSuccess((payload: { options: AliasOptions }) => withCache({ payload }), {
        maxAge: ALIAS_OPTIONS_MAX_AGE,
    })
);

export const getAliasOptionsFailure = createAction(
    'alias::options::get::failure',
    withRequestFailure((error: unknown) =>
        withNotification({ type: 'error', text: c('Error').t`Requesting alias options failed`, error })({
            payload: {},
            error,
        })
    )
);

export const getAliasDetailsIntent = createAction(
    'alias::details::get::intent',
    (payload: { shareId: string; itemId: string; aliasEmail: string }) =>
        withRequest({ status: 'start', id: aliasDetailsRequest(payload.aliasEmail) })({ payload })
);

export const getAliasDetailsSuccess = createAction(
    'alias::details::get::success',
    withRequestSuccess((payload: { aliasEmail: string; mailboxes: AliasMailbox[] }) => withCache({ payload }), {
        maxAge: ALIAS_DETAILS_MAX_AGE,
    })
);

export const getAliasDetailsFailure = createAction(
    'alias::details::get::failure',
    withRequestFailure((payload: { aliasEmail: string }, error: unknown) => ({ payload, error }))
);

export const aliasDetailsSync = createAction(
    'alias::details::sync',
    (payload: { aliasEmail: string; mailboxes: AliasMailbox[] }) => withCache({ payload })
);

export const aliasSyncEnable = requestActionsFactory<ShareId, boolean>('alias::sync::enable')({
    requestId: aliasSyncEnableRequest,
    success: {
        prepare: () =>
            withNotification({
                text: c('Success').t`Aliases sync enabled successfully. SimpleLogin aliases may take some time to sync`,
                type: 'success',
            })({ payload: null }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                text: c('Error').t`Failed to sync aliases`,
                type: 'error',
                error,
            })({ payload: null }),
    },
});

export const aliasSyncPending = requestActionsFactory<void, { items: ItemRevision[]; shareId: string }>(
    'alias::sync::pending'
)({ requestId: aliasSyncPendingRequest });

export const aliasSyncStatus = requestActionsFactory<void, SlSyncStatusOutput, void>('alias::sync::status')({
    requestId: aliasSyncStatusRequest,
    success: { config: { maxAge: UNIX_MINUTE } },
});

export const aliasSyncStatusToggle = requestActionsFactory<AliasToggleStatusDTO, SelectedItem & { item: ItemRevision }>(
    'alias::sync::status::toggle'
)({
    requestId: ({ shareId, itemId }) => aliasSyncToggleStatusRequest(shareId, itemId),
    success: {
        prepare: ({ shareId, itemId, item }) =>
            pipe(
                withCache,
                withNotification({
                    type: 'info',
                    text: isAliasDisabled(item)
                        ? c('Info')
                              .t`Alias succcessfully disabled. You will no longer receive emails sent to ${item.aliasEmail}`
                        : c('Info')
                              .t`Alias succcessfully enabled. You can now receive emails sent to ${item.aliasEmail}`,
                })
            )({ payload: { shareId, itemId, item } }),
    },
    failure: {
        prepare: (error) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Alias could not be updated at the moment. Please try again later`,
                error,
            })({ payload: {} }),
    },
});
