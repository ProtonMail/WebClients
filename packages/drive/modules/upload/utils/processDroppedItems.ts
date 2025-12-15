import { processFileSystemEntry } from './processFileSystemEntry';

/**
 * Type guard for DataTransferItemList
 */
export function isDataTransferList(
    filesOrDataTransfer: File[] | FileList | DataTransfer
): filesOrDataTransfer is DataTransfer {
    return 'items' in filesOrDataTransfer;
}

/**
 * Processes dropped items from a drag-and-drop operation and converts them to Files.
 *
 * Uses the FileSystemEntry API to support folder structure traversal.
 *
 * @param dataTransfer - The DataTransfer object from a drop event
 * @returns Promise resolving to an array of Files with webkitRelativePath set
 */
export async function processDroppedItems(dataTransfer: DataTransfer): Promise<File[]> {
    const { items } = dataTransfer;
    const collectedFiles: File[] = [];

    const promises: Promise<void>[] = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const entry =
            item.webkitGetAsEntry?.() ??
            (item as typeof item & { getAsEntry?: () => FileSystemEntry | null }).getAsEntry?.() ??
            null;

        if (entry) {
            const promise = processFileSystemEntry(entry).then((files) => {
                collectedFiles.push(...files);
            });
            promises.push(promise);
            continue;
        }

        const file = item.getAsFile?.();
        if (file) {
            collectedFiles.push(file);
        }
    }

    await Promise.all(promises);

    return collectedFiles;
}
