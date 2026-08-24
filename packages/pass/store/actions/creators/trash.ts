import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { BatchItemRevisionIDs } from '../../../types';
import { pipe } from '../../../utils/fp/pipe';
import { withRequest, withRequestFailure, withRequestProgress, withRequestSuccess } from '../../request/enhancers';
import { withCache } from '../enhancers/cache';
import { withItems, withItemsBatch } from '../enhancers/items';
import { withNotification } from '../enhancers/notification';
import { trashEmptyRequest, trashRestoreRequest } from '../requests';

export const emptyTrashIntent = createAction('trash::empty::intent', () =>
    pipe(
        withRequest({ status: 'start', id: trashEmptyRequest() }),
        withNotification({
            type: 'info',
            text: c('Info').t`Emptying trash...`,
            loading: true,
            expiration: -1,
        })
    )({ payload: {} })
);

export const emptyTrashFailure = createAction(
    'trash::empty::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Emptying trash failed`,
            error,
        })({ payload: {}, error })
    )
);

export const emptyTrashProgress = createAction(
    'trash::empty::progress',
    withRequestProgress((payload: BatchItemRevisionIDs) => pipe(withItemsBatch, withCache)({ payload }))
);

export const emptyTrashSuccess = createAction(
    'trash::empty::success',
    withRequestSuccess(() =>
        pipe(
            withItems,
            withNotification({
                type: 'success',
                text: c('Info').t`All trashed items permanently deleted`,
            })
        )({ payload: {} })
    )
);

export const restoreTrashIntent = createAction('trash::restore::intent', () =>
    pipe(
        withRequest({ status: 'start', id: trashRestoreRequest() }),
        withNotification({
            type: 'info',
            text: c('Info').t`Restoring trashed items...`,
            loading: true,
            expiration: -1,
        })
    )({ payload: {} })
);

export const restoreTrashFailure = createAction(
    'trash::restore::failure',
    withRequestFailure((error: unknown) =>
        withNotification({
            type: 'error',
            text: c('Error').t`Restoring trashed items failed`,
            error,
        })({ payload: {}, error })
    )
);

export const restoreTrashProgress = createAction(
    'trash::restore::progress',
    withRequestProgress((payload: BatchItemRevisionIDs) => pipe(withItemsBatch, withCache)({ payload }))
);

export const restoreTrashSuccess = createAction(
    'trash::restore::success',
    withRequestSuccess(() =>
        pipe(
            withItems,
            withNotification({
                type: 'success',
                text: c('Info').t`All trashed items successfully restored`,
            })
        )({ payload: {} })
    )
);
