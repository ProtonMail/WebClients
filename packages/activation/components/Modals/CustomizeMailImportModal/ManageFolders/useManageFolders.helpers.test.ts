import { folderWithChildren, getRenamedFolders } from '@proton/activation/tests/data/folders';

import { renameChildFolders } from './useManageFolders.helpers';

describe('renameChildFolders', () => {
    it('Should rename all child in proton path', () => {
        const folders = [...folderWithChildren];
        const newFolders = [...folders];
        const newFolder = { ...newFolders[0] };
        const newName = 'newName';

        newFolder.protonPath = [...newFolder.protonPath];
        newFolder.protonPath[newFolder.protonPath.length - 1] = newName;
        newFolders[0] = newFolder;

        const renameFolders = renameChildFolders(newFolder, newFolders, newName);
        expect(renameFolders).toStrictEqual(getRenamedFolders(newName));
    });
});
