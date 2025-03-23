import type { ExportRequestOptions } from '@proton/pass/lib/export/types';
import { requestActionsFactory } from '@proton/pass/store/request/flow';

export const exportData = requestActionsFactory<ExportRequestOptions, string>('export::data')({});
