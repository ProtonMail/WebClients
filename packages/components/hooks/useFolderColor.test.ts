import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import { FOLDER_COLOR, INHERIT_PARENT_FOLDER_COLOR } from '@proton/shared/lib/mail/mailSettings';

import useFolderColor from './useFolderColor';

const mockFolderSetting = FOLDER_COLOR.ENABLED;
const mockinheritSetting = INHERIT_PARENT_FOLDER_COLOR.ENABLED;
jest.mock('@proton/mail/mailSettings/hooks', () => ({
    useMailSettings: jest.fn(() => [
        { EnableFolderColor: mockFolderSetting, InheritParentFolderColor: mockinheritSetting },
        false,
    ]),
}));

jest.mock('./useCategories', () => ({
    useFolders: () => [
        [
            { ID: 'A', Color: 'red' },
            { ID: 'B', Color: 'blue', ParentID: 'A' },
            { ID: 'C', Color: 'green', ParentID: 'B' },
        ],
        false,
    ],
}));

describe('useFolderColor hook', () => {
    it('should not return color if EnableFolderColor is disabled', () => {
        (useMailSettings as jest.Mock).mockReturnValueOnce([
            { EnableFolderColor: FOLDER_COLOR.DISABLED, InheritParentFolderColor: INHERIT_PARENT_FOLDER_COLOR.ENABLED },
            false,
        ]);
        const folder = { ID: 'C', Color: 'green' } as Folder;
        const color = useFolderColor(folder);
        expect(color).toBe(undefined);
    });

    it('should return current color if InheritParentFolderColor is disabled', () => {
        (useMailSettings as jest.Mock).mockReturnValueOnce([
            { EnableFolderColor: FOLDER_COLOR.ENABLED, InheritParentFolderColor: INHERIT_PARENT_FOLDER_COLOR.DISABLED },
            false,
        ]);
        const folder = { ID: 'C', Color: 'green', ParentID: 'B' } as Folder;
        const color = useFolderColor(folder);
        expect(color).toBe('green');
    });

    it('should return current folder color since it is a root', () => {
        const folder = { ID: 'C', Color: 'green' } as Folder;
        const color = useFolderColor(folder);
        expect(color).toBe('green');
    });

    it('should search for root folder color', () => {
        const folder = { ID: 'C', Color: 'green', ParentID: 'B' } as Folder;
        const color = useFolderColor(folder);
        expect(color).toBe('red');
    });
});
