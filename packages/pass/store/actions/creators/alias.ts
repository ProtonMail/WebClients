import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { AliasMailbox } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';

import type { AliasOptions } from '../../reducers';
import * as requests from '../requests';
import withCacheBlock from '../with-cache-block';
import type { ActionCallback } from '../with-callback';
import withCallback from '../with-callback';
import withNotification from '../with-notification';
import withRequest from '../with-request';

export const getAliasOptionsIntent = createAction(
    'alias::options::get::intent',

    (
        payload: { shareId: string },
        callback?: ActionCallback<ReturnType<typeof getAliasOptionsSuccess> | ReturnType<typeof getAliasOptionsFailure>>
    ) =>
        pipe(
            withRequest({ id: requests.aliasOptions(), type: 'start' }),
            withCacheBlock,
            withCallback(callback)
        )({ payload })
);

export const getAliasOptionsSuccess = createAction(
    'alias::options::get::success',
    (payload: { options: AliasOptions }) =>
        withRequest({ id: requests.aliasOptions(), type: 'success', persistent: true })({ payload })
);

export const getAliasOptionsFailure = createAction('alias::options::get::failure', (error: unknown) =>
    pipe(
        withRequest({ id: requests.aliasOptions(), type: 'failure' }),
        withNotification({ type: 'error', text: c('Error').t`Requesting alias options failed`, error })
    )({ payload: {}, error })
);

export const getAliasDetailsIntent = createAction(
    'alias::details::get::intent',
    (payload: { shareId: string; itemId: string; aliasEmail: string }) =>
        pipe(
            withCacheBlock,
            withRequest({
                id: requests.aliasDetails(payload.aliasEmail),
                type: 'start',
            })
        )({ payload })
);

export const getAliasDetailsSuccess = createAction(
    'alias::details::get::success',
    (payload: { aliasEmail: string; mailboxes: AliasMailbox[] }) =>
        withRequest({ id: requests.aliasDetails(payload.aliasEmail), type: 'success' })({ payload })
);

export const getAliasDetailsFailure = createAction(
    'alias::details::get::failure',
    (payload: { aliasEmail: string }, error: unknown) =>
        pipe(
            withRequest({ id: requests.aliasDetails(payload.aliasEmail), type: 'failure' }),
            withNotification({
                type: 'error',
                text: c('Error').t`Requesting alias details failed`,
                error,
            })
        )({ payload })
);

export const aliasDetailsSync = createAction(
    'alias::details::sync',
    (payload: { aliasEmail: string; mailboxes: AliasMailbox[] }) => ({ payload })
);
