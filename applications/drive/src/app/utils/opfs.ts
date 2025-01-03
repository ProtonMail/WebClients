import { sendErrorReport } from './errorHandling';

export const clearOPFS = async () => {
    try {
        const root = await navigator.storage.getDirectory();
        // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle/values
        // Recent addition: so we must check for existence
        if (typeof (root as any).values !== 'undefined') {
            for await (const entry of (root as any).values()) {
                await root.removeEntry(entry.name, { recursive: true });
            }
        }
    } catch (e) {
        sendErrorReport(e);
    }
};
