import { canGetAsyncInboxDesktopData, getInboxDesktopAsyncData, hasInboxDesktopFeature } from './ipcHelpers';

// The bug report modal supports up to 50MB of data transfer.
// though let's add some leeway for the other form data.
const MAX_REPORT_SIZE = 45 * 1024 * 1024;

export const getInboxDesktopLogsBlob = async (currentAttachmentSize: number): Promise<Blob | null> => {
    if (!canGetAsyncInboxDesktopData || !hasInboxDesktopFeature('BugReportLogAttachments')) {
        return null;
    }

    const availableSize = MAX_REPORT_SIZE - currentAttachmentSize;

    try {
        const uint8Array = await getInboxDesktopAsyncData('getElectronLogs', availableSize);
        if (uint8Array && uint8Array.length > 0) {
            const blob = new Blob([new Uint8Array(uint8Array)], { type: 'text/plain' });
            return blob;
        }
        return null;
    } catch (_error) {
        return null;
    }
};

export const isInboxDesktopBugReportLogsSupported = (): boolean => {
    if (!canGetAsyncInboxDesktopData || !hasInboxDesktopFeature('BugReportLogAttachments')) {
        return false;
    }

    return true;
};
