import { MemberRole, NodeType } from '@proton/drive/sdk';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { SortField } from '../../modules/sorting';
import { getFolderSortConfig } from './folder.sorting';
import { type FolderViewItem, useFolderStore } from './useFolder.store';

const makeFolder = (name: string): FolderViewItem => ({
    uid: `volume~${name}`,
    name,
    rootShareId: 'share',
    parentLinkId: 'parent',
    linkId: name,
    volumeId: 'volume',
    activeRevisionUid: undefined,
    id: name,
    mimeType: 'Folder',
    isFile: false,
    hasThumbnail: false,
    size: 0,
    metaDataModifyTime: 0,
    fileModifyTime: new Date(2020, 0, 1),
    trashed: null,
    parentUid: 'volume~parent',
    hasSignatureIssues: false,
    type: NodeType.Folder,
    effectiveRole: MemberRole.Admin,
});

const alpha = makeFolder('Alpha');
const beta = makeFolder('Beta');
const charlie = makeFolder('Charlie');

const sortByName = () =>
    useFolderStore.getState().setSorting({
        sortField: SortField.name,
        direction: SORT_DIRECTION.ASC,
        sortConfig: getFolderSortConfig(SortField.name),
    });

const getSortedNames = () =>
    useFolderStore.getState().sortedItemUids.map((uid) => useFolderStore.getState().items.get(uid)?.name);

describe('useFolderStore import positions', () => {
    beforeEach(() => {
        useFolderStore.getState().setImportingFolders([]);
        useFolderStore.getState().reset();
        sortByName();
        useFolderStore.getState().setItems([alpha, beta, charlie]);
    });

    it('lists the folders of ongoing imports first, then the others in sort order', () => {
        useFolderStore.getState().setImportingFolders([{ uid: charlie.uid, importedBytes: 0 }]);

        expect(getSortedNames()).toEqual(['Charlie', 'Alpha', 'Beta']);
    });

    it('keeps a finished import in place until the list is sorted again', () => {
        useFolderStore.getState().setImportingFolders([{ uid: charlie.uid, importedBytes: 0 }]);
        useFolderStore.getState().setImportingFolders([]);

        expect(getSortedNames()).toEqual(['Charlie', 'Alpha', 'Beta']);

        sortByName();

        expect(getSortedNames()).toEqual(['Alpha', 'Beta', 'Charlie']);
    });

    it('releases a finished import when a folder loads, but keeps an ongoing one first', () => {
        useFolderStore.getState().setImportingFolders([{ uid: charlie.uid, importedBytes: 0 }]);
        useFolderStore.getState().setImportingFolders([{ uid: beta.uid, importedBytes: 0 }]);

        useFolderStore.getState().reset();
        useFolderStore.getState().setItems([alpha, beta, charlie]);

        expect(getSortedNames()).toEqual(['Beta', 'Alpha', 'Charlie']);
    });
});
