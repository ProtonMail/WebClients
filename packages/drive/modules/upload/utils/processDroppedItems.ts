import { type ProcessFileSystemEntryOptions, processFileSystemEntry } from './processFileSystemEntry';
import { uploadLogDebug, uploadLogError } from './uploadLogger';

export interface ProcessDroppedItemsOptions extends ProcessFileSystemEntryOptions {
    batchId?: string;
}

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
export async function processDroppedItems(
    dataTransfer: DataTransfer,
    options: ProcessDroppedItemsOptions = {}
): Promise<File[]> {
    const { items } = dataTransfer;
    const collectedFiles: File[] = [];

    const promises: Promise<void>[] = [];
    let directoryCount = 0;
    let nonFileItemCount = 0;
    let emptyItemCount = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const entry =
            item.webkitGetAsEntry?.() ??
            (item as typeof item & { getAsEntry?: () => FileSystemEntry | null }).getAsEntry?.() ??
            null;

        if (item.kind !== 'file') {
            nonFileItemCount++;
        }
        if (entry?.isDirectory) {
            directoryCount++;
        }

        // The dropped file payload must be retrieved synchronously: the browser can release the
        // underlying blob once the drop event finishes propagating, which has been observed on
        // Brave (DRVWEB-5473) where the async FileSystemFileEntry.file() callback resolves with
        // a 0-byte File. DataTransferItem.getAsFile() reads the payload synchronously and avoids the race.
        const file = entry === null || entry.isFile ? item.getAsFile?.() : undefined;

        if (file) {
            collectedFiles.push(file);
            continue;
        }

        if (entry) {
            promises.push(
                processFileSystemEntry(entry, options).then((files) => {
                    collectedFiles.push(...files);
                })
            );
            continue;
        }

        emptyItemCount++;
    }

    // Logged before awaiting, the browser empties the item list once the drop event is over.
    uploadLogDebug('Dropped items', {
        batchId: options.batchId,
        itemCount: items.length,
        dataTransferFileCount: dataTransfer.files.length,
        directoryCount,
        nonFileItemCount,
        emptyItemCount,
        traversedEntryCount: promises.length,
    });

    try {
        await Promise.all(promises);
    } catch (error) {
        uploadLogError('Failed to read dropped entries', error);
        throw error;
    }

    return collectedFiles;
}
