import * as useLabelsModule from '@proton/mail/store/labels/hooks';
import type { Label } from '@proton/shared/lib/interfaces/Label';

jest.mock('@proton/mail/store/labels/hooks', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/mail/store/labels/hooks'),
    useFolders: jest.fn(),
    useLabels: jest.fn(),
}));

export const mockUseLabels = (params?: [Label[]?, boolean?]) => {
    const [value = [], loading = false] = params ?? [];

    const mockedUseLabels = jest.mocked(useLabelsModule.useLabels);
    mockedUseLabels.mockReturnValue([value, loading]);

    return mockedUseLabels;
};
