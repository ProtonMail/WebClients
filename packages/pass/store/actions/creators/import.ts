import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ImportPayload, ImportProvider } from '@proton/pass/lib/import/types';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import type { ImportEntry } from '@proton/pass/store/reducers';
import { withRequestProgress } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { ClientEndpoint, IndexedByShareIdAndItemId, ItemRevision, UniqueItem } from '@proton/pass/types';

export type ImportFile = UniqueItem & { filename: string };

type ImportIntentDTO = { data: ImportPayload; provider: ImportProvider };
type ImportFailureDTO = { endpoint?: ClientEndpoint };
type ImportSuccessDTO = {
    data: ImportEntry;
    files: IndexedByShareIdAndItemId<string[]>;
    endpoint?: ClientEndpoint;
};

type ImportProgressDTO = { shareId: string; items: ItemRevision[] };

export const importItems = requestActionsFactory<ImportIntentDTO, ImportSuccessDTO, ImportFailureDTO>('import::items')({
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
