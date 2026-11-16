import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import { FOLDER_COLOR, INHERIT_PARENT_FOLDER_COLOR } from '@proton/shared/lib/mail/mailSettings';

import { getParentFolderColor } from './helpers';

const folders = [
    { ID: 'parent', Name: 'Parent', Color: 'blue', ParentID: null },
    { ID: 'child', Name: 'Child', Color: 'red', ParentID: 'parent' },
    { ID: 'grandchild', Name: 'Grandchild', Color: 'green', ParentID: 'child' },
    { ID: 'aloneFolder', Name: 'aloneFolder', Color: 'pink', ParentID: null },
] as FolderWithSubFolders[];

describe('useMailFolderTreeView', () => {
    describe('getParentFolderColor', () => {
        it('Should return undefined if the folder color is disabled', () => {
            const mailSettings = {
                EnableFolderColor: FOLDER_COLOR.DISABLED,
                InheritParentFolderColor: INHERIT_PARENT_FOLDER_COLOR.DISABLED,
            } as unknown as MailSettings;

            const result = getParentFolderColor({
                folders,
                folder: folders[1],
                mailSettings,
            });

            expect(result).toBe(undefined);
        });

        it('Should return the folder color if the parent inheritence is disabled', () => {
            const mailSettings = {
                EnableFolderColor: FOLDER_COLOR.ENABLED,
                InheritParentFolderColor: INHERIT_PARENT_FOLDER_COLOR.DISABLED,
            } as unknown as MailSettings;

            const result = getParentFolderColor({
                folders,
                folder: folders[1],
                mailSettings,
            });

            expect(result).toBe('red');
        });

        it('Should return parent when the parent inheritence is enabled', () => {
            const mailSettings = {
                EnableFolderColor: FOLDER_COLOR.ENABLED,
                InheritParentFolderColor: INHERIT_PARENT_FOLDER_COLOR.ENABLED,
            } as unknown as MailSettings;

            const result = getParentFolderColor({
                folders,
                folder: folders[2],
                mailSettings,
            });

            expect(result).toBe('blue');
        });

        it('Should return the current folder color if there is no parent', () => {
            const mailSettings = {
                EnableFolderColor: FOLDER_COLOR.ENABLED,
                InheritParentFolderColor: INHERIT_PARENT_FOLDER_COLOR.ENABLED,
            } as unknown as MailSettings;

            const result = getParentFolderColor({
                folders,
                folder: folders[3],
                mailSettings,
            });

            expect(result).toBe('pink');
        });

        describe('when the parent chain contains a cycle', () => {
            const mailSettings = {
                EnableFolderColor: FOLDER_COLOR.ENABLED,
                InheritParentFolderColor: INHERIT_PARENT_FOLDER_COLOR.ENABLED,
            } as unknown as MailSettings;

            it('Should return undefined if a folder is its own parent', () => {
                const cyclicFolders = [
                    { ID: 'self', Name: 'Self', Color: 'red', ParentID: 'self' },
                ] as FolderWithSubFolders[];

                const result = getParentFolderColor({ folders: cyclicFolders, folder: cyclicFolders[0], mailSettings });

                expect(result).toBe(undefined);
            });

            it('Should return undefined if two folders are each other parent', () => {
                const cyclicFolders = [
                    { ID: 'a', Name: 'A', Color: 'red', ParentID: 'b' },
                    { ID: 'b', Name: 'B', Color: 'blue', ParentID: 'a' },
                ] as FolderWithSubFolders[];

                const result = getParentFolderColor({ folders: cyclicFolders, folder: cyclicFolders[0], mailSettings });

                expect(result).toBe(undefined);
            });

            it('Should return undefined for a folder outside of a longer cycle that leads into it', () => {
                const cyclicFolders = [
                    { ID: 'a', Name: 'A', Color: 'red', ParentID: 'c' },
                    { ID: 'b', Name: 'B', Color: 'blue', ParentID: 'a' },
                    { ID: 'c', Name: 'C', Color: 'green', ParentID: 'b' },
                    { ID: 'leaf', Name: 'Leaf', Color: 'pink', ParentID: 'a' },
                ] as FolderWithSubFolders[];

                const result = getParentFolderColor({ folders: cyclicFolders, folder: cyclicFolders[3], mailSettings });

                expect(result).toBe(undefined);
            });
        });
    });
});
