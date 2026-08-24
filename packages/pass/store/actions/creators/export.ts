import type { ExportRequestOptions, ExportResult } from '../../../lib/export/types';
import type { WithTabId } from '../../../types';
import { requestActionsFactory } from '../../request/flow';
import { withAbortPayload } from './utils';

export const exportData = requestActionsFactory<WithTabId<ExportRequestOptions>, ExportResult>('export::data')({
    key: ({ tabId }: WithTabId) => `${tabId ?? 0}`,
    failure: { prepare: withAbortPayload },
});
