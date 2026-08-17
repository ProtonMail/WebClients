import { c } from 'ttag';

import { filterIgnoredFiles, getIgnoredReason } from './shouldIgnoreFile';

export interface FolderNode {
    name: string;
    files: File[];
    subfolders: Map<string, FolderNode>;
}

export interface FolderStructure {
    root: FolderNode;
    /** How many files each ignore pattern kept out of the queue */
    ignoredFiles: Record<string, number>;
}

export const buildFolderStructure = (files: FileList | File[]): FolderStructure => {
    const allFiles = Array.from(files);

    if (allFiles.length === 0) {
        throw new Error(c('Error').t`No file to upload`);
    }

    const firstPath = allFiles[0].webkitRelativePath || allFiles[0].name;
    const rootFolderName = firstPath.split('/')[0];

    if (!allFiles.some((f) => (f.webkitRelativePath || '').includes('/'))) {
        const fileArray = filterIgnoredFiles(allFiles);
        if (fileArray.length === 0) {
            throw new Error(c('Error').t`No file to upload`);
        }
    }

    const root: FolderNode = {
        name: rootFolderName,
        files: [],
        subfolders: new Map(),
    };

    const ignoredFiles: Record<string, number> = {};

    for (const file of allFiles) {
        const relativePath = file.webkitRelativePath || file.name;
        const pathParts = relativePath.split('/').filter((p) => p.length > 0);

        let currentNode = root;

        for (let i = 1; i < pathParts.length - 1; i++) {
            const folderName = pathParts[i];

            if (!currentNode.subfolders.has(folderName)) {
                currentNode.subfolders.set(folderName, {
                    name: folderName,
                    files: [],
                    subfolders: new Map(),
                });
            }

            const currentFolderNode = currentNode.subfolders.get(folderName);

            if (currentFolderNode) {
                currentNode = currentFolderNode;
            }
        }

        const ignoredReason = getIgnoredReason(file);
        if (ignoredReason) {
            ignoredFiles[ignoredReason] = (ignoredFiles[ignoredReason] ?? 0) + 1;
        } else {
            currentNode.files.push(file);
        }
    }

    return { root, ignoredFiles };
};
