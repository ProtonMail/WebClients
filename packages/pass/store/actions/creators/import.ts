import { createAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ImportReport } from '@proton/pass/lib/import/helpers/report';
import type { ImportPayload, ImportProvider } from '@proton/pass/lib/import/types';
import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { withRequestProgress } from '@proton/pass/store/request/enhancers';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type {
    ClientEndpoint,
    IndexedByShareIdAndItemId,
    ItemRevision,
    UniqueItem,
    WithTabId,
} from '@proton/pass/types';

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

export const importItems = requestActionsFactory<WithTabId<ImportIntentDTO>, ImportSuccessDTO, ImportFailureDTO>(
    'import::items'
)({
    key: ({ tabId }: WithTabId) => `${tabId ?? 0}`,
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

export const importReport = createAction('import::files::report', (report: ImportReport) =>
    withCache({ payload: { report } })
);
