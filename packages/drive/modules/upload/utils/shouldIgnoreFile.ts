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

export const shouldIgnoreFile = (file: File, ignorePatterns: string[] = DEFAULT_IGNORE_PATTERNS): boolean => {
    const fileName = file.name;
    const filePath = file.webkitRelativePath || file.name;

    for (const pattern of ignorePatterns) {
        if (fileName === pattern) {
            return true;
        }

        if (filePath.includes(`/${pattern}/`) || filePath.startsWith(`${pattern}/`)) {
            return true;
        }

        if (fileName.startsWith(pattern)) {
            return true;
        }
    }

    return false;
};

export const filterIgnoredFiles = (files: FileList | File[]): File[] => {
    const patterns = DEFAULT_IGNORE_PATTERNS;
    return Array.from(files).filter((file) => !shouldIgnoreFile(file, patterns));
};
