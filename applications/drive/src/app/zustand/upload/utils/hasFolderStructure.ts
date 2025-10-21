/**
 * Checks if the provided files have a folder structure or are flat files
 * @param files - Array of files to check
 * @returns true if any file has a folder structure (path with more than one segment), false otherwise
 */
export const hasFolderStructure = (files: File[]): boolean => {
    return files.some((file) => {
        const relativePath = file.webkitRelativePath || '';
        return relativePath.split('/').filter((p) => p.length > 0).length > 1;
    });
};
