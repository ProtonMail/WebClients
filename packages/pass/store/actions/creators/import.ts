import { createAction } from '@reduxjs/toolkit';
import { c, msgid } from 'ttag';

import type { ImportPayload, ImportProvider } from '@proton/pass/lib/import/types';
import { itemsImportRequest } from '@proton/pass/store/actions//requests';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import type { ImportEntry } from '@proton/pass/store/reducers';
import { withRequestProgress } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { ClientEndpoint, ItemRevision } from '@proton/pass/types';

type ImportIntentDTO = { data: ImportPayload; provider: ImportProvider };
type ImportSuccessDTO = { data: ImportEntry; endpoint?: ClientEndpoint };
type ImportFailureDTO = { endpoint?: ClientEndpoint };
type ImportProgressDTO = { shareId: string; items: ItemRevision[] };

export const importItems = requestActionsFactory<ImportIntentDTO, ImportSuccessDTO, ImportFailureDTO>('import::items')({
    key: itemsImportRequest,
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'info',
                endpoint: payload.endpoint,
                text: c('Info').ngettext(
                    // translator: ${payload.total} is a number
                    msgid`Imported ${payload.data.total} item`,
                    `Imported ${payload.data.total} items`,
                    payload.data.total
                ),
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                endpoint: payload.endpoint,
                expiration: -1,
                text: c('Error').t`Importing items failed`,
                error,
            })({ payload, error }),
    },
});

export const importItemsProgress = createAction(
    'import::items::progress',
    withRequestProgress((payload: ImportProgressDTO) => withCache({ payload }))
);
