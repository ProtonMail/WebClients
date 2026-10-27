import { logError } from '@proton/drive/legacy/errorHandling';

export const clearOPFS = async () => {
    try {
        const root = await navigator.storage.getDirectory();
        // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle/values
        // Recent addition: so we must check for existence
        if (typeof root.values !== 'undefined') {
            for await (const entry of root.values()) {
                await root.removeEntry(entry.name, { recursive: true });
            }
        }
    } catch (e) {
        logError(e);
    }
};
