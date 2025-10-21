import { processFileSystemEntry } from './processFileSystemEntry';

/**
 * Processes dropped items from a drag-and-drop operation and converts them to Files.
 * Handles both FileSystemEntry API (for directory support) and fallback to getAsFile().
 *
 * @param items - The DataTransferItemList from a drop event
 * @returns Promise resolving to an array of Files
 */
export async function processDroppedItems(items: DataTransferItemList): Promise<File[]> {
    const allFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry();

            if (entry) {
                const files = await processFileSystemEntry(entry);
                allFiles.push(...files);
            } else {
                const file = item.getAsFile();
                if (file) {
                    allFiles.push(file);
                }
            }
        }
    }
    return allFiles;
}
