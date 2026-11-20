import type { Mock } from 'vitest';

import { updateLumoUserSettingsWithAutoSave, type IndexedDriveFolder } from '../redux/slices/lumoUserSettings';
import type { LumoStore } from '../redux/store';
import { setStoreRef } from '../redux/storeRef';
import { removeIndexedContentForSpace } from './removeIndexedContentForSpace';
import { SearchService } from './search/searchService';

vi.mock('./search/searchService', () => ({
    SearchService: {
        get: vi.fn(),
    },
}));

const createIndexedDriveFolder = (nodeUid: string, spaceId: string): IndexedDriveFolder => ({
    id: nodeUid,
    nodeUid,
    name: `Folder ${nodeUid}`,
    path: `/drive/${nodeUid}`,
    spaceId,
    indexedAt: 1,
    documentCount: 1,
    isActive: true,
});

describe('removeIndexedContentForSpace', () => {
    const removeDocumentsBySpace = vi.fn();
    const dispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (SearchService.get as Mock).mockReturnValue({ removeDocumentsBySpace });
        setStoreRef({
            getState: () => ({
                lumoUserSettings: {
                    indexedDriveFolders: [
                        createIndexedDriveFolder('folder-1', 'space-1'),
                        createIndexedDriveFolder('folder-2', 'space-2'),
                    ],
                },
            }),
            dispatch,
        } as unknown as LumoStore);
    });

    it('removes indexed folders and search documents for the space', () => {
        removeIndexedContentForSpace('space-1', 'user-1');

        expect(dispatch).toHaveBeenCalledWith(
            updateLumoUserSettingsWithAutoSave({
                indexedDriveFolders: [createIndexedDriveFolder('folder-2', 'space-2')],
            })
        );
        expect(SearchService.get).toHaveBeenCalledWith('user-1');
        expect(removeDocumentsBySpace).toHaveBeenCalledWith('space-1');
    });

    it('still removes search documents when there are no indexed folders', () => {
        setStoreRef({
            getState: () => ({
                lumoUserSettings: {
                    indexedDriveFolders: [],
                },
            }),
            dispatch,
        } as unknown as LumoStore);

        removeIndexedContentForSpace('space-1', 'user-1');

        expect(dispatch).not.toHaveBeenCalled();
        expect(removeDocumentsBySpace).toHaveBeenCalledWith('space-1');
    });

    it('removes only drive documents when unlinking a folder', () => {
        const removeDriveDocumentsBySpace = vi.fn();
        (SearchService.get as Mock).mockReturnValue({ removeDriveDocumentsBySpace });

        removeIndexedContentForSpace('space-1', 'user-1', { documentScope: 'drive-only' });

        expect(removeDriveDocumentsBySpace).toHaveBeenCalledWith('space-1');
        expect(removeDocumentsBySpace).not.toHaveBeenCalled();
    });
});
