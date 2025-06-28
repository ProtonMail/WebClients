import type { FolderWithSubFolders, MailSettings } from '@proton/shared/lib/interfaces';
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
    });
});
