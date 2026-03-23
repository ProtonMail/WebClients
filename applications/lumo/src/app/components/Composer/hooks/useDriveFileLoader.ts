/** Lazy loads and refreshes the flat Drive file list from a linked folder. */
import { useCallback, useEffect, useRef, useState } from 'react';

import type { DriveSDKFunctions } from './useFileMentionAutocomplete';

export function useDriveFileLoader(
    linkedDriveFolder: { folderId: string } | undefined,
    driveSDK: DriveSDKFunctions | undefined,
    onRefresh?: () => void
): {
    driveFiles: { id: string; name: string }[];
    refreshDriveFiles: () => Promise<void>;
} {
    const [driveFiles, setDriveFiles] = useState<{ id: string; name: string }[]>([]);
    const driveFilesLoadedRef = useRef(false);

    useEffect(() => {
        if (!linkedDriveFolder) {
            setDriveFiles([]);
            driveFilesLoadedRef.current = false;
        }
    }, [linkedDriveFolder]);

    const loadRecursively = useCallback(
        async (folderId: string, path: string = ''): Promise<{ id: string; name: string; path: string }[]> => {
            if (!driveSDK) return [];

            try {
                const children = await driveSDK.browseFolderChildren(folderId);
                const allFiles: { id: string; name: string; path: string }[] = [];

                for (const child of children) {
                    const childPath = path ? `${path}/${child.name}` : child.name;

                    if (child.type === 'file') {
                        allFiles.push({ id: child.id, name: child.name, path: childPath });
                    } else if (child.type === 'folder') {
                        const subFiles = await loadRecursively(child.id, childPath);
                        allFiles.push(...subFiles);
                    }
                }

                return allFiles;
            } catch (error) {
                console.error(`Failed to load Drive files from folder ${folderId}:`, error);
                return [];
            }
        },
        [driveSDK]
    );

    const refreshDriveFiles = useCallback(async () => {
        if (!linkedDriveFolder || !driveSDK) return;

        try {
            const allFiles = await loadRecursively(linkedDriveFolder.folderId);
            setDriveFiles(allFiles.map((file) => ({ id: file.id, name: file.path })));
            driveFilesLoadedRef.current = true;
            onRefresh?.();
        } catch (error) {
            console.error('Failed to load Drive files for autocomplete:', error);
        }
    }, [linkedDriveFolder, driveSDK, loadRecursively, onRefresh]);

    useEffect(() => {
        if (!linkedDriveFolder || driveFilesLoadedRef.current || !driveSDK) return;
        void refreshDriveFiles();
    }, [linkedDriveFolder, driveSDK, refreshDriveFiles]);

    return { driveFiles, refreshDriveFiles };
}
