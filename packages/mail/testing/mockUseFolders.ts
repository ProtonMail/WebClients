import { vi } from 'vitest';

import type { Folder } from '@proton/shared/lib/interfaces/Folder';

import './mockLabelsHooks';
import * as useFoldersModule from '../store/labels/hooks';

export const mockUseFolders = (params?: [Folder[]?, boolean?]) => {
    const [value = [], loading = false] = params ?? [];

    const mockedUseFolders = vi.mocked(useFoldersModule.useFolders);
    mockedUseFolders.mockReturnValue([value, loading]);

    return mockedUseFolders;
};
