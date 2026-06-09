import { EMPTY_FOLDER_PLACEHOLDER_FILE, EMPTY_FOLDER_PLACEHOLDER_MIMETYPE } from '../constants';

function isFileSystemFileEntry(entry: FileSystemEntry): entry is FileSystemFileEntry {
    return entry.isFile;
}

function isFileSystemDirectoryEntry(entry: FileSystemEntry): entry is FileSystemDirectoryEntry {
    return entry.isDirectory;
}

export interface ProcessFileSystemEntryOptions {
    skipEmptyFolders?: boolean;
}

/**
 * Recursively processes a FileSystemEntry and converts it to an array of Files with webkitRelativePath set.
 *
 * @param entry - The FileSystemEntry to process (file or directory)
 * @param options.skipEmptyFolders - When true, empty directories are ignored instead of receiving a placeholder file
 * @returns Promise resolving to an array of Files with webkitRelativePath property set
 */
export function processFileSystemEntry(
    entry: FileSystemEntry,
    options: ProcessFileSystemEntryOptions = {}
): Promise<File[]> {
    return processRecursive(entry, '', options);
}

async function processRecursive(
    entry: FileSystemEntry,
    path: string,
    options: ProcessFileSystemEntryOptions
): Promise<File[]> {
    const files: File[] = [];

    if (isFileSystemFileEntry(entry)) {
        const file = await new Promise<File>((resolve, reject) => {
            entry.file(resolve, reject);
        });

        // webkitRelativePath is read-only on File objects so defineProperty is needed to set it so
        // drag-and-drop uploads are compatible with the same pipeline as <input webkitdirectory> uploads.
        Object.defineProperty(file, 'webkitRelativePath', {
            value: path.concat(file.name),
            writable: false,
        });

        files.push(file);
    } else if (isFileSystemDirectoryEntry(entry)) {
        const dirReader = entry.createReader();

        const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
            const allEntries: FileSystemEntry[] = [];

            function readEntries() {
                dirReader.readEntries((entries) => {
                    if (entries.length === 0) {
                        resolve(allEntries);
                    } else {
                        allEntries.push(...entries);
                        readEntries();
                    }
                }, reject);
            }

            readEntries();
        });

        if (entries.length === 0) {
            // Create placeholder for empty directories to preserve folder structure
            if (!options.skipEmptyFolders) {
                const keepFile = new File([], EMPTY_FOLDER_PLACEHOLDER_FILE, {
                    type: EMPTY_FOLDER_PLACEHOLDER_MIMETYPE,
                });
                Object.defineProperty(keepFile, 'webkitRelativePath', {
                    value: path.concat(entry.name).concat(`/${EMPTY_FOLDER_PLACEHOLDER_FILE}`),
                    writable: false,
                });
                files.push(keepFile);
            }
        } else {
            for (const childEntry of entries) {
                const childPath = path.concat(entry.name).concat('/');
                const childFiles = await processRecursive(childEntry, childPath, options);
                files.push(...childFiles);
            }
        }
    }

    return files;
}
