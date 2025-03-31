import type { ExportRequestOptions } from '@proton/pass/lib/export/types';
import { requestActionsFactory } from '@proton/pass/store/request/flow';

export const exportData = requestActionsFactory<ExportRequestOptions, { filename: string; mimeType: string }>(
    'export::data'
)({});
