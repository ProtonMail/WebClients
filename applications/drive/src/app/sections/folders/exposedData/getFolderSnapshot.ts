import { useFolderStore } from '../useFolder.store';

export interface FolderSnapshot {
    folder?: { name: string; isRoot: boolean };
    fileCount: number;
    folderCount: number;
    isLoading: boolean;
}

/**
 * This function is done to get info about current folder state outside of the sections (like for Lumo)
 */
export const getFolderSnapshot = (): FolderSnapshot => {
    const { folder, items, isLoading } = useFolderStore.getState();

    let fileCount = 0;
    let folderCount = 0;
    for (const item of items.values()) {
        if (item.isFile) {
            fileCount += 1;
        } else {
            folderCount += 1;
        }
    }

    return {
        folder: folder && { name: folder.name, isRoot: folder.isRoot },
        fileCount,
        folderCount,
        isLoading,
    };
};
