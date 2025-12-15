import { c } from 'ttag';

import { filterIgnoredFiles, shouldIgnoreFile } from './shouldIgnoreFile';

export interface FolderNode {
    name: string;
    files: File[];
    subfolders: Map<string, FolderNode>;
}

export const buildFolderStructure = (files: FileList | File[]): FolderNode => {
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

        if (!shouldIgnoreFile(file)) {
            currentNode.files.push(file);
        }
    }

    return root;
};
