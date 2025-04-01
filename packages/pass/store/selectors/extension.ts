import { exportData, fileDownload, fileUploadChunk, importItems } from '@proton/pass/store/actions';
import type { State } from '@proton/pass/store/types';
import type { TabId } from '@proton/pass/types';

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
            return false;
        });
