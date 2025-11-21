import { processFileSystemEntry } from './processFileSystemEntry';

/**
 * Processes dropped items from a drag-and-drop operation and converts them to Files.
 *
 * Handles both FileSystemEntry API (for directory support) and fallback to getAsFile().
 * Some browsers (e.g. Safari, Windows Chromium builds) surface only the first dropped file
 * via DataTransferItem.kind === 'file'; the rest show up exclusively in `DataTransfer.files`.
 * https://caniuse.com/dragndrop as per caniuse `dataTransfer.items only supported by Chrome`
 *
 * Passing the fallback list ensures we still pick up those additional entries.
 *
 * @param items - The DataTransferItemList from a drop event
 * @param fallbackFiles - Optional FileList to cover browsers that expose files only via DataTransfer.files
 * @returns Promise resolving to an array of Files
 */
export async function processDroppedItems(
    items: DataTransferItemList,
    fallbackFiles?: FileList | null
): Promise<File[]> {
    const collectedFiles: File[] = [];
    const seen = new Set();

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        const entry =
            item.webkitGetAsEntry?.() ??
            (item as typeof item & { getAsEntry?: () => FileSystemEntry | null }).getAsEntry?.() ??
            null;

        if (entry) {
            const files = await processFileSystemEntry(entry);
            files.forEach((f) => seen.add(f.name));
            collectedFiles.push(...files);
            continue;
        }

        const file = item.getAsFile?.();
        if (file && !seen.has(file.name)) {
            seen.add(file.name);
            collectedFiles.push(file);
        }
    }

    if (fallbackFiles && fallbackFiles.length > 0) {
        collectedFiles.push(...Array.from(fallbackFiles).filter((file) => !!file.type && !seen.has(file.name)));
    }

    return collectedFiles;
}
