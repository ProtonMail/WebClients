import { ApiMailImporterFolder } from '@proton/activation/src/api/api.interface';
import MailImportFoldersParser from '@proton/activation/src/helpers/MailImportFoldersParser/MailImportFoldersParser';
import {
    folderWithChildren,
    getRenamedFolders,
    getRenamedLabel,
    labelsWithChildren,
} from '@proton/activation/src/tests/data/folders';
import { Label } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';

import { formatItems, renameChildFolders } from './useManageFolders.helpers';

describe('renameChildFolders', () => {
    it('Should rename all child in proton path', () => {
        const folders = [...folderWithChildren];
        const newFolders = [...folders];
        const newFolder = { ...newFolders[0] };
        const newName = 'newName';

        newFolder.protonPath = [...newFolder.protonPath];
        newFolder.protonPath[newFolder.protonPath.length - 1] = newName;
        newFolders[0] = newFolder;

        const renameFolders = renameChildFolders(newFolder, newFolders, newName, false);
        expect(renameFolders).toStrictEqual(getRenamedFolders(newName));
    });

    it('Should rename all child in proton path without breaking childs when label mapping', () => {
        const folders = [...labelsWithChildren];
        const newFolders = [...folders];
        const newFolder = { ...newFolders[0] };
        const newName = 'Prog';

        newFolder.protonPath = [...newFolder.protonPath];
        newFolder.protonPath[newFolder.protonPath.length - 1] = newName;
        newFolders[0] = newFolder;

        const renameFolders = renameChildFolders(newFolder, newFolders, newName, true);
        expect(renameFolders).toStrictEqual(getRenamedLabel(newName));
    });
});

describe('formatItems', () => {
    it('should compare labels and not folders with mapping when isLabelMapping is false', () => {
        const apiFolders = ['flavien', 'guillaume'].map(
            (folder) => ({ Source: folder, Separator: '/' }) as ApiMailImporterFolder
        );
        const isLabelMapping = false;
        const mapping = new MailImportFoldersParser(apiFolders, isLabelMapping).folders;
        const result = formatItems({
            labels: [
                {
                    Name: 'flavien',
                    Path: 'flavien',
                } as Label,
            ],
            folders: [
                {
                    Name: 'guillaume',
                    Path: 'guillaume',
                } as Folder,
            ],
            isLabelMapping,
            mapping,
        });

        expect(result.find((item) => item.id === 'flavien')?.errors).toContain('Unavailable names');
        expect(result.find((item) => item.id === 'guillaume')?.errors).toEqual([]);
    });

    it('should compare folders and not labels with mapping when isLabelMapping is true', () => {
        const apiFolders = ['flavien', 'guillaume'].map(
            (folder) => ({ Source: folder, Separator: '/' }) as ApiMailImporterFolder
        );
        const isLabelMapping = true;
        const mapping = new MailImportFoldersParser(apiFolders, isLabelMapping).folders;
        const result = formatItems({
            folders: [
                {
                    Name: 'flavien',
                    Path: 'flavien',
                } as Folder,
            ],
            labels: [
                {
                    Name: 'guillaume',
                    Path: 'guillaume',
                } as Label,
            ],
            isLabelMapping,
            mapping,
        });

        expect(result.find((item) => item.id === 'flavien')?.errors).toContain('Unavailable names');
        expect(result.find((item) => item.id === 'guillaume')?.errors).toEqual([]);
    });
});
