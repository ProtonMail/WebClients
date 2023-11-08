import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import withCacheBlock from '@proton/pass/store/actions/with-cache-block';
import withNotification from '@proton/pass/store/actions/with-notification';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { trashEmptyRequest, trashRestoreRequest } from '../requests';
import withRequest, { withRequestFailure, withRequestSuccess } from '../with-request';

export const emptyTrashIntent = createAction('trash::empty::intent', () =>
    pipe(
        withRequest({ type: 'start', id: trashEmptyRequest() }),
        withNotification({
            type: 'info',
            text: c('Info').t`Emptying trash...`,
            loading: true,
            expiration: -1,
        }),
        withCacheBlock
    )({ payload: {} })
);

export const emptyTrashFailure = createAction(
    'trash::empty::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Emptying trash failed`,
                error,
            })
        )({ payload: {}, error })
    )
);

export const emptyTrashSuccess = createAction(
    'trash::empty::success',
    withRequestSuccess(() =>
        withNotification({
            type: 'success',
            text: c('Info').t`All trashed items permanently removed`,
        })({ payload: {} })
    )
);

export const restoreTrashIntent = createAction('trash::restore::intent', () =>
    pipe(
        withRequest({ type: 'start', id: trashRestoreRequest() }),
        withNotification({
            type: 'info',
            text: c('Info').t`Restoring trashed items...`,
            loading: true,
            expiration: -1,
        }),
        withCacheBlock
    )({ payload: {} })
);

export const restoreTrashFailure = createAction(
    'trash::restore::failure',
    withRequestFailure((error: unknown) =>
        pipe(
            withCacheBlock,
            withNotification({
                type: 'error',
                text: c('Error').t`Restoring trashed items failed`,
                error,
            })
        )({ payload: {}, error })
    )
);

export const restoreTrashSuccess = createAction(
    'trash::restore::success',
    withRequestSuccess(() =>
        withNotification({
            type: 'success',
            text: c('Info').t`All trashed items successfully restored`,
        })({ payload: {} })
    )
);
