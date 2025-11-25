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
 * Handles both FileSystemEntry API (for directory support) and fallback to getAsFile().
 * Some browsers (e.g. Safari, Windows Chromium builds) surface only the first dropped file
 * via DataTransferItem.kind === 'file'; the rest show up exclusively in `DataTransfer.files`.
 *
 * @param items - The DataTransferItemList from a drop event
 * @param fallbackFiles - Optional FileList to cover browsers that expose files only via DataTransfer.files
 * @returns Promise resolving to an array of Files
 */
export async function processDroppedItems(dataTransfer: DataTransfer): Promise<File[]> {
    const { items, files: fallbackFiles } = dataTransfer;
    const collectedFiles: File[] = [];
    const seen = new Set<string>();
    const rootFolderNames = new Set<string>();

    const promises: Promise<void>[] = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const entry =
            item.webkitGetAsEntry?.() ??
            (item as typeof item & { getAsEntry?: () => FileSystemEntry | null }).getAsEntry?.() ??
            null;

        if (entry) {
            if (entry.isDirectory) {
                rootFolderNames.add(entry.name);
            }

            const promise = processFileSystemEntry(entry).then((files) => {
                files.forEach((f) => {
                    if (!seen.has(f.name)) {
                        seen.add(f.name);
                        collectedFiles.push(f);
                    }
                });
            });
            promises.push(promise);
            continue;
        }

        const file = item.getAsFile?.();
        if (file && !seen.has(file.name)) {
            seen.add(file.name);
            collectedFiles.push(file);
        }
    }

    await Promise.all(promises);

    if (fallbackFiles && fallbackFiles.length > 0) {
        for (const file of Array.from(fallbackFiles)) {
            const isRootFolderMarker = rootFolderNames.has(file.name) && !seen.has(file.name);
            if (!isRootFolderMarker && !seen.has(file.name)) {
                seen.add(file.name);
                collectedFiles.push(file);
            }
        }
    }

    return collectedFiles;
}
