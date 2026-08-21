import { updateLumoUserSettingsWithAutoSave } from '../redux/slices/lumoUserSettings';
import { getStoreRef } from '../redux/storeRef';
import type { SpaceId } from '../types';
import { cancelFolderIndexingForSpace } from './driveFolderIndexingState';
import { SearchService } from './search/searchService';

export type RemoveIndexedContentScope = 'all' | 'drive-only';

/**
 * Removes Drive folder indexing metadata and search documents for a deleted space.
 * Safe to call from sagas and React hooks (via useDriveFolderIndexing).
 */
export function removeIndexedContentForSpace(
    spaceId: SpaceId,
    userId?: string,
    options: { documentScope?: RemoveIndexedContentScope } = {}
): void {
    const { documentScope = 'all' } = options;
    const store = getStoreRef();
    if (!store) {
        return;
    }

    try {
        const latestFolders = store.getState().lumoUserSettings.indexedDriveFolders || [];
        const foldersToRemove = latestFolders.filter((f) => f.spaceId === spaceId);

        if (foldersToRemove.length > 0) {
            console.log('[DriveIndexing] Removing indexed folders for space:', spaceId);
            cancelFolderIndexingForSpace(foldersToRemove.map((folder) => folder.nodeUid));

            const updatedFolders = latestFolders.filter((f) => f.spaceId !== spaceId);
            store.dispatch(
                updateLumoUserSettingsWithAutoSave({
                    indexedDriveFolders: updatedFolders,
                })
            );

            console.log('[DriveIndexing] Removed', foldersToRemove.length, 'folders for space:', spaceId);
        }

        if (userId) {
            const searchService = SearchService.get(userId);
            if (documentScope === 'drive-only') {
                void searchService.removeDriveDocumentsBySpace(spaceId);
            } else {
                void searchService.removeDocumentsBySpace(spaceId);
            }
        }
    } catch (error) {
        console.log('[DriveIndexing] Failed to remove indexed content for space:', spaceId, error);
    }
}
