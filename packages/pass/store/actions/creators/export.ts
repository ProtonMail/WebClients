import type { ExportRequestOptions, ExportResult } from '@proton/pass/lib/export/types';
import { withAbortPayload } from '@proton/pass/store/actions/creators/utils';
import { requestActionsFactory } from '@proton/pass/store/request/flow';

export const exportData = requestActionsFactory<ExportRequestOptions, ExportResult>('export::data')({
    failure: { prepare: withAbortPayload },
});
