import * as useFoldersModule from '@proton/mail/store/labels/hooks';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';

jest.mock('@proton/mail/store/labels/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/mail/store/labels/hooks'),
    useFolders: jest.fn(),
    useLabels: jest.fn(),
}));

export const mockUseFolders = (params?: [Folder[]?, boolean?]) => {
    const [value = [], loading = false] = params ?? [];

    const mockedUseFolders = jest.mocked(useFoldersModule.useFolders);
    mockedUseFolders.mockReturnValue([value, loading]);

    return mockedUseFolders;
};
