import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { AliasMailbox } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';

import type { AliasOptions } from '../../reducers';
import { ALIAS_OPTIONS_VALIDITY_WINDOW } from '../../sagas/alias-options-request.saga';
import withCacheBlock from '../with-cache-block';
import type { ActionCallback } from '../with-callback';
import withCallback from '../with-callback';
import withNotification from '../with-notification';
import { withRequestFailure, withRequestStart, withRequestSuccess } from '../with-request';

export const getAliasOptionsIntent = createAction(
    'alias::options::get::intent',
    withRequestStart(
        (
            payload: { shareId: string },
            callback?: ActionCallback<
                ReturnType<typeof getAliasOptionsSuccess> | ReturnType<typeof getAliasOptionsFailure>
            >
        ) => pipe(withCacheBlock, withCallback(callback))({ payload })
    )
);

export const getAliasOptionsSuccess = createAction(
    'alias::options::get::success',
    withRequestSuccess((payload: { options: AliasOptions }) => ({ payload }), { maxAge: ALIAS_OPTIONS_VALIDITY_WINDOW })
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
    withRequestStart((payload: { shareId: string; itemId: string; aliasEmail: string }) => withCacheBlock({ payload }))
);

export const getAliasDetailsSuccess = createAction(
    'alias::details::get::success',
    withRequestSuccess((payload: { aliasEmail: string; mailboxes: AliasMailbox[] }) => ({ payload }))
);

export const getAliasDetailsFailure = createAction(
    'alias::details::get::failure',
    withRequestFailure((payload: { aliasEmail: string }, error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Requesting alias details failed`,
            error,
        })({ payload, error })
    )
);

export const aliasDetailsSync = createAction(
    'alias::details::sync',
    (payload: { aliasEmail: string; mailboxes: AliasMailbox[] }) => ({ payload })
);
