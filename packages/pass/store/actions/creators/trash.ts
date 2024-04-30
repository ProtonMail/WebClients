import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { trashEmptyRequest, trashRestoreRequest } from '@proton/pass/store/actions/requests';
import {
    withRequest,
    withRequestFailure,
    withRequestProgress,
    withRequestSuccess,
} from '@proton/pass/store/request/enhancers';
import type { BatchItemRevisionIDs } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

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
    withRequestProgress((payload: BatchItemRevisionIDs) => withCache({ payload }))
);

export const emptyTrashSuccess = createAction(
    'trash::empty::success',
    withRequestSuccess(() =>
        pipe(
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
    withRequestProgress((payload: BatchItemRevisionIDs) => withCache({ payload }))
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
