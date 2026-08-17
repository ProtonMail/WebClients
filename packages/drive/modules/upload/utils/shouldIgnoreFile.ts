import { EMPTY_FOLDER_PLACEHOLDER_FILE } from '../constants';

const DEFAULT_IGNORE_PATTERNS = [
    '.DS_Store', // macOS metadata
    'Thumbs.db', // Windows thumbnail cache
    'desktop.ini', // Windows folder settings
    '__MACOSX', // macOS resource fork
    '.localized', // macOS localization
    '.Spotlight-V100', // macOS Spotlight
    '.Trashes', // macOS trash
    '.fseventsd', // macOS file system events
    '.TemporaryItems', // macOS temporary items
];

/**
 * Returns the pattern that makes the file ignored, so callers can report why a
 * file never made it to the upload queue. Undefined when the file is kept.
 */
export const getIgnoredReason = (
    file: File,
    ignorePatterns: string[] = DEFAULT_IGNORE_PATTERNS
): string | undefined => {
    const fileName = file.name;
    const filePath = file.webkitRelativePath || file.name;

    for (const pattern of ignorePatterns.concat(EMPTY_FOLDER_PLACEHOLDER_FILE)) {
        if (fileName === pattern) {
            return pattern;
        }

        if (filePath.includes(`/${pattern}/`) || filePath.startsWith(`${pattern}/`)) {
            return pattern;
        }

        if (fileName.startsWith(pattern)) {
            return pattern;
        }
    }

    return undefined;
};

export const shouldIgnoreFile = (file: File, ignorePatterns: string[] = DEFAULT_IGNORE_PATTERNS): boolean => {
    return getIgnoredReason(file, ignorePatterns) !== undefined;
};

export const filterIgnoredFiles = (files: FileList | File[]): File[] => {
    const patterns = DEFAULT_IGNORE_PATTERNS.concat(EMPTY_FOLDER_PLACEHOLDER_FILE);
    return Array.from(files).filter((file) => !shouldIgnoreFile(file, patterns));
};
