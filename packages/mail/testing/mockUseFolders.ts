import type { Folder } from '@proton/shared/lib/interfaces/Folder';

import * as useFoldersModule from '../store/labels/hooks';

jest.mock('../store/labels/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('../store/labels/hooks'),
    useFolders: jest.fn(),
    useLabels: jest.fn(),
}));

export const mockUseFolders = (params?: [Folder[]?, boolean?]) => {
    const [value = [], loading = false] = params ?? [];

    const mockedUseFolders = jest.mocked(useFoldersModule.useFolders);
    mockedUseFolders.mockReturnValue([value, loading]);

    return mockedUseFolders;
};
