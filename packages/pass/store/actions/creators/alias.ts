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

export const aliasOptionsRequested = createAction(
    'alias options requested',
    (
        payload: { shareId: string },
        callback?: ActionCallback<
            ReturnType<typeof aliasOptionsRequestSuccess> | ReturnType<typeof aliasOptionsRequestFailure>
        >
    ) =>
        pipe(
            withCacheBlock,
            withCallback(callback),
            withRequest({
                id: requests.aliasOptions(),
                type: 'start',
            })
        )({ payload })
);

export const aliasOptionsRequestSuccess = createAction(
    'alias options request success',
    (payload: { options: AliasOptions }) =>
        withRequest({
            id: requests.aliasOptions(),
            type: 'success',
        })({ payload })
);

export const aliasOptionsRequestFailure = createAction('alias options request failure', (error: unknown) =>
    pipe(
        withRequest({
            id: requests.aliasOptions(),
            type: 'failure',
        }),
        withNotification({
            type: 'error',
            text: c('Error').t`Requesting alias options failed`,
            error,
        })
    )({ payload: {}, error })
);

export const aliasDetailsRequested = createAction(
    'alias details requested',
    (payload: { shareId: string; itemId: string; aliasEmail: string }) =>
        pipe(
            withCacheBlock,
            withRequest({
                id: requests.aliasDetails(payload.aliasEmail),
                type: 'start',
            })
        )({ payload })
);

export const aliasDetailsRequestSuccess = createAction(
    'alias details request success',
    (payload: { aliasEmail: string; mailboxes: AliasMailbox[] }) =>
        withRequest({
            id: requests.aliasDetails(payload.aliasEmail),
            type: 'success',
        })({ payload })
);

export const aliasDetailsRequestFailure = createAction(
    'alias details request success',
    (payload: { aliasEmail: string }, error: unknown) =>
        pipe(
            withRequest({
                id: requests.aliasDetails(payload.aliasEmail),
                type: 'failure',
            }),
            withNotification({
                type: 'error',
                text: c('Error').t`Requesting alias details failed`,
                error,
            })
        )({ payload })
);

export const aliasDetailsEditSuccess = createAction(
    'alias details edit success',
    (payload: { aliasEmail: string; mailboxes: AliasMailbox[] }) => ({ payload })
);
