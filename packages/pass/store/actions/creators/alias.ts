import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { ALIAS_DETAILS_MAX_AGE, ALIAS_OPTIONS_MAX_AGE } from '@proton/pass/constants';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { type ActionCallback, withCallback } from '@proton/pass/store/actions/enhancers/callback';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { aliasDetailsRequest, aliasOptionsRequest } from '@proton/pass/store/actions/requests';
import { withRequest, withRequestFailure, withRequestSuccess } from '@proton/pass/store/request/enhancers';
import type { AliasMailbox, AliasOptions } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

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
