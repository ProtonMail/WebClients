import type { TabId } from '../../types/worker/runtime';
import { exportData } from '../actions/creators/export';
import { fileDownload, fileUploadChunk } from '../actions/creators/files';
import { importItems } from '../actions/creators/import';
import { checkCompromisedPasswords } from '../actions/creators/monitor';
import type { State } from '../types';

const matchesTabRequest =
    (namespace: string, tabId: TabId) =>
    (requestId: string): boolean =>
        requestId.startsWith(`${namespace}::${tabId}`);

export const selectPendingSettingsRequests =
    (tabId: TabId) =>
    ({ request }: State): string[] =>
        Object.keys(request).filter((requestID) => {
            if (matchesTabRequest(exportData.namespace, tabId)(requestID)) return true;
            if (matchesTabRequest(importItems.namespace, tabId)(requestID)) return true;
            return false;
        });

export const selectPendingPopupRequests =
    (tabId: TabId) =>
    ({ request }: State): string[] =>
        Object.keys(request).filter((requestID) => {
            if (matchesTabRequest(fileUploadChunk.namespace, tabId)(requestID)) return true;
            if (matchesTabRequest(fileDownload.namespace, tabId)(requestID)) return true;
            if (matchesTabRequest(checkCompromisedPasswords.namespace, tabId)(requestID)) return true;
            return false;
        });
