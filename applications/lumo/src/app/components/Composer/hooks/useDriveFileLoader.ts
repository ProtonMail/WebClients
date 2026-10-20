/** Lazy loads and refreshes the flat Drive file list from a linked folder. */
import { useCallback, useEffect, useRef, useState } from 'react';

import { isDriveFileSupported } from '../../../util/filetypes';
import type { DriveSDKFunctions } from './useFileMentionAutocomplete';

export type DriveFileEntry = { id: string; name: string; mediaType?: string };

export function useDriveFileLoader(
    linkedDriveFolder: { folderId: string } | undefined,
    driveSDK: DriveSDKFunctions | undefined,
    onRefresh?: () => void,
    /** Bumps when the search index changes — triggers a fresh Drive folder listing. */
    driveIndexRevision: number = 0
): {
    driveFiles: DriveFileEntry[];
    refreshDriveFiles: () => Promise<void>;
} {
    const [driveFiles, setDriveFiles] = useState<DriveFileEntry[]>([]);
    const driveFilesLoadedRef = useRef(false);

    useEffect(() => {
        if (!linkedDriveFolder) {
            setDriveFiles([]);
            driveFilesLoadedRef.current = false;
        }
    }, [linkedDriveFolder]);

    const loadRecursively = useCallback(
        async (folderId: string, path: string = ''): Promise<DriveFileEntry[]> => {
            if (!driveSDK) return [];

            try {
                const children = await driveSDK.browseFolderChildren(folderId);
                const allFiles: DriveFileEntry[] = [];

                for (const child of children) {
                    const childPath = path ? `${path}/${child.name}` : child.name;

                    if (child.type === 'file') {
                        if (isDriveFileSupported(child.name, child.mediaType)) {
                            allFiles.push({ id: child.id, name: childPath, mediaType: child.mediaType });
                        }
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
            setDriveFiles(allFiles);
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

    // Re-list Drive files when the search index changes (e.g. file deleted on Drive).
    useEffect(() => {
        if (!linkedDriveFolder || !driveSDK || driveIndexRevision === 0) return;
        void refreshDriveFiles();
    }, [driveIndexRevision, linkedDriveFolder, driveSDK, refreshDriveFiles]);

    return { driveFiles, refreshDriveFiles };
}
