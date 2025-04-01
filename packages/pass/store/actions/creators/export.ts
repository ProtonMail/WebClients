import type { ExportRequestOptions, ExportResult } from '@proton/pass/lib/export/types';
import { withAbortPayload } from '@proton/pass/store/actions/creators/utils';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { WithTabId } from '@proton/pass/types';

export const exportData = requestActionsFactory<WithTabId<ExportRequestOptions>, ExportResult>('export::data')({
    key: ({ tabId }: WithTabId) => `${tabId ?? 0}`,
    failure: { prepare: withAbortPayload },
});
