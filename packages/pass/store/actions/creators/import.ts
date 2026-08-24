import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ImportReport } from '../../../lib/import/helpers/report';
import type { ImportPayload, ImportProvider } from '../../../lib/import/types';
import type { ClientEndpoint, IndexedByShareIdAndItemId, ItemRevision, UniqueItem, WithTabId } from '../../../types';
import { withRequestProgress } from '../../request/enhancers';
import { requestActionsFactory } from '../../request/flow';
import { withCache } from '../enhancers/cache';
import { withItems } from '../enhancers/items';
import { withNotification } from '../enhancers/notification';

export type ImportFile = UniqueItem & { filename: string };
export type ImportFilesReport = { totalFiles: number; ignoredFiles: string[] };

type ImportIntentDTO = { data: ImportPayload; provider: ImportProvider };
type ImportFailureDTO = { report: ImportReport; endpoint?: ClientEndpoint };
type ImportSuccessDTO = {
    report: ImportReport;
    files: IndexedByShareIdAndItemId<string[]>;
    endpoint?: ClientEndpoint;
};

type ImportProgressDTO = { shareId: string; items: ItemRevision[] };

export const importItems = requestActionsFactory<WithTabId<ImportIntentDTO>, ImportSuccessDTO, ImportFailureDTO>('import::items')({
    key: ({ tabId }: WithTabId) => `${tabId ?? 0}`,
    success: { prepare: (payload) => withItems({ payload }) },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                endpoint: payload.endpoint,
                text: c('Error').t`Importing items failed`,
                error,
            })({ payload, error }),
    },
});

export const importItemsProgress = createAction(
    'import::items::progress',
    withRequestProgress((payload: ImportProgressDTO) => withCache({ payload }))
);

export const importReport = createAction('import::files::report', (report: ImportReport) => withCache({ payload: { report } }));
