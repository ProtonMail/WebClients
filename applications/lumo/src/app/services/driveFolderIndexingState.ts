const cancelledFolderUids = new Set<string>();

let onIndexingCancelled: (() => void) | null = null;

/** Allows DriveIndexingProvider to clear pending tree events when indexing is cancelled. */
export const registerDriveIndexingCancelHandler = (handler: () => void): (() => void) => {
    onIndexingCancelled = handler;
    return () => {
        if (onIndexingCancelled === handler) {
            onIndexingCancelled = null;
        }
    };
};

export const cancelFolderIndexing = (folderUid: string) => {
    cancelledFolderUids.add(folderUid);
    onIndexingCancelled?.();
};

export const cancelFolderIndexingForSpace = (folderUids: string[]) => {
    for (const folderUid of folderUids) {
        cancelledFolderUids.add(folderUid);
    }
    if (folderUids.length > 0) {
        onIndexingCancelled?.();
    }
};

export const clearFolderIndexingCancellation = (folderUid: string) => {
    cancelledFolderUids.delete(folderUid);
};

export const isFolderIndexingCancelled = (folderUid: string) => cancelledFolderUids.has(folderUid);
