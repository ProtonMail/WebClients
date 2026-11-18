import type { Mock } from 'vitest';

import { useFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import { FOLDER_COLOR, INHERIT_PARENT_FOLDER_COLOR } from '@proton/shared/lib/mail/mailSettings';

import useFolderColor from './useFolderColor';

const mockFolderSetting = FOLDER_COLOR.ENABLED;
const mockinheritSetting = INHERIT_PARENT_FOLDER_COLOR.ENABLED;
vi.mock('@proton/mail/store/mailSettings/hooks', () => ({
    useMailSettings: vi.fn(() => [
        { EnableFolderColor: mockFolderSetting, InheritParentFolderColor: mockinheritSetting },
        false,
    ]),
}));

vi.mock('@proton/mail/store/labels/hooks', () => ({
    useFolders: vi.fn(() => [
        [
            { ID: 'A', Color: 'red' },
            { ID: 'B', Color: 'blue', ParentID: 'A' },
            { ID: 'C', Color: 'green', ParentID: 'B' },
        ],
        false,
    ]),
}));

describe('useFolderColor hook', () => {
    it('should not return color if EnableFolderColor is disabled', () => {
        (useMailSettings as Mock).mockReturnValueOnce([
            {
                EnableFolderColor: FOLDER_COLOR.DISABLED,
                InheritParentFolderColor: INHERIT_PARENT_FOLDER_COLOR.ENABLED,
            },
            false,
        ]);
        const folder = { ID: 'C', Color: 'green' } as Folder;
        const color = useFolderColor(folder);
        expect(color).toBe(undefined);
    });

    it('should return current color if InheritParentFolderColor is disabled', () => {
        (useMailSettings as Mock).mockReturnValueOnce([
            {
                EnableFolderColor: FOLDER_COLOR.ENABLED,
                InheritParentFolderColor: INHERIT_PARENT_FOLDER_COLOR.DISABLED,
            },
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

    it('should return undefined if the parent folder does not exist', () => {
        const folder = { ID: 'X', Color: 'green', ParentID: 'unknown' } as Folder;
        const color = useFolderColor(folder);
        expect(color).toBe(undefined);
    });

    describe('when the parent chain contains a cycle', () => {
        it('should not recurse forever if a folder is its own parent', () => {
            (useFolders as Mock).mockReturnValueOnce([[{ ID: 'A', Color: 'red', ParentID: 'A' }], false]);
            const folder = { ID: 'A', Color: 'red', ParentID: 'A' } as Folder;
            expect(useFolderColor(folder)).toBe(undefined);
        });

        it('should not recurse forever if two folders are each other parent', () => {
            (useFolders as Mock).mockReturnValueOnce([
                [
                    { ID: 'A', Color: 'red', ParentID: 'B' },
                    { ID: 'B', Color: 'blue', ParentID: 'A' },
                ],
                false,
            ]);
            const folder = { ID: 'A', Color: 'red', ParentID: 'B' } as Folder;
            expect(useFolderColor(folder)).toBe(undefined);
        });

        it('should not recurse forever on a longer cycle reached from a folder outside of it', () => {
            (useFolders as Mock).mockReturnValueOnce([
                [
                    { ID: 'A', Color: 'red', ParentID: 'C' },
                    { ID: 'B', Color: 'blue', ParentID: 'A' },
                    { ID: 'C', Color: 'green', ParentID: 'B' },
                ],
                false,
            ]);
            const folder = { Name: 'child', Color: 'pink', ParentID: 'A' } as Folder;
            expect(useFolderColor(folder)).toBe(undefined);
        });
    });
});
