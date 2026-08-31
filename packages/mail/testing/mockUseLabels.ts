import type { Label } from '@proton/shared/lib/interfaces/Label';

import * as useLabelsModule from '../store/labels/hooks';

jest.mock('../store/labels/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('../store/labels/hooks'),
    useFolders: jest.fn(),
    useLabels: jest.fn(),
}));

export const mockUseLabels = (params?: [Label[]?, boolean?]) => {
    const [value = [], loading = false] = params ?? [];

    const mockedUseLabels = jest.mocked(useLabelsModule.useLabels);
    mockedUseLabels.mockReturnValue([value, loading]);

    return mockedUseLabels;
};
