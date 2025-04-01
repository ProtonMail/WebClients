import { isAbortError } from '@proton/pass/lib/api/errors';
import type { ExportRequestOptions, ExportResult } from '@proton/pass/lib/export/types';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';

export const exportData = requestActionsFactory<ExportRequestOptions, ExportResult>('export::data')({
    failure: {
        prepare: (error) => ({
            payload: {
                aborted: isAbortError(error),
                error: getErrorMessage(error),
            },
        }),
    },
});
