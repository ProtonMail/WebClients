import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { ALIAS_DETAILS_MAX_AGE, ALIAS_OPTIONS_MAX_AGE } from '@proton/pass/constants';
import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import type { ActionCallback } from '@proton/pass/store/actions/with-callback';
import withCallback from '@proton/pass/store/actions/with-callback';
import withNotification from '@proton/pass/store/actions/with-notification';
import withRequest, { withRequestFailure, withRequestSuccess } from '@proton/pass/store/actions/with-request';
import type { AliasOptions } from '@proton/pass/store/reducers';
import type { AliasMailbox } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { aliasDetailsRequest, aliasOptionsRequest } from '../requests';

export const getAliasOptionsIntent = createAction(
    'alias::options::get::intent',
    (
        payload: { shareId: string },
        callback?: ActionCallback<ReturnType<typeof getAliasOptionsSuccess> | ReturnType<typeof getAliasOptionsFailure>>
    ) =>
        pipe(
            withRequest({ type: 'start', id: aliasOptionsRequest(payload.shareId) }),
            withCacheBlock,
            withCallback(callback)
        )({ payload })
);

export const getAliasOptionsSuccess = createAction(
    'alias::options::get::success',
    withRequestSuccess((payload: { options: AliasOptions }) => ({ payload }), { maxAge: ALIAS_OPTIONS_MAX_AGE })
);

export const getAliasOptionsFailure = createAction(
    'alias::options::get::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({ type: 'error', text: c('Error').t`Requesting alias options failed`, error })
        )({ payload: {}, error })
    )
);

export const getAliasDetailsIntent = createAction(
    'alias::details::get::intent',
    (payload: { shareId: string; itemId: string; aliasEmail: string }) =>
        pipe(withRequest({ type: 'start', id: aliasDetailsRequest(payload.aliasEmail) }), withCacheBlock)({ payload })
);

export const getAliasDetailsSuccess = createAction(
    'alias::details::get::success',
    withRequestSuccess((payload: { aliasEmail: string; mailboxes: AliasMailbox[] }) => ({ payload }), {
        maxAge: ALIAS_DETAILS_MAX_AGE,
    })
);

export const getAliasDetailsFailure = createAction(
    'alias::details::get::failure',
    withRequestFailure((payload: { aliasEmail: string }, error: unknown) => withCacheBlock({ payload, error }))
);

export const aliasDetailsSync = createAction(
    'alias::details::sync',
    (payload: { aliasEmail: string; mailboxes: AliasMailbox[] }) => ({ payload })
);
