import * as useFoldersModule from '@proton/mail/labels/hooks';
import { Folder } from '@proton/shared/lib/interfaces/Folder';

export const mockUseFolders = (params?: [Folder[]?, boolean?]) => {
    const [value = [], loading = false] = params ?? [];

    const mockedUseFolders = jest.spyOn(useFoldersModule, 'useFolders');
    mockedUseFolders.mockReturnValue([value, loading]);

    return mockedUseFolders;
};
