import { createAction } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';

import type { ImportPayload, ImportProvider } from '@proton/pass/lib/import/types';
import { itemsImportRequest } from '@proton/pass/store/actions//requests';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import type { ImportEntry } from '@proton/pass/store/reducers';
import {
    withRequest,
    withRequestFailure,
    withRequestProgress,
    withRequestSuccess,
} from '@proton/pass/store/request/enhancers';
import type { ClientEndpoint, ItemRevision } from '@proton/pass/types';

export const importItemsIntent = createAction(
    'import::items::intent',
    (payload: { data: ImportPayload; provider: ImportProvider }) =>
        withRequest({ status: 'start', id: itemsImportRequest() })({ payload })
);

export const importItemsSuccess = createAction(
    'import::items::success',
    withRequestSuccess((payload: ImportEntry, endpoint?: ClientEndpoint) =>
        withNotification({
            type: 'info',
            endpoint,
            text: c('Info').ngettext(
                // translator: ${payload.total} is a number
                msgid`Imported ${payload.total} item`,
                `Imported ${payload.total} items`,
                payload.total
            ),
        })({ payload })
    )
);

export const importItemsFailure = createAction(
    'import::items::failure',
    withRequestFailure((error: unknown, endpoint?: ClientEndpoint) =>
        withNotification({
            type: 'error',
            endpoint,
            expiration: -1,
            text: c('Error').t`Importing items failed`,
            error,
        })({ payload: {}, error })
    )
);

export const importItemsProgress = createAction(
    'import::items::progress',
    withRequestProgress((payload: { shareId: string; items: ItemRevision[] }) => withCache({ payload }))
);
