import * as useLabelsModule from '@proton/components/hooks/useCategories';
import { Label } from '@proton/shared/lib/interfaces/Label';

export const mockUseLabels = (params?: [Label[]?, boolean?]) => {
    const [value = [], loading = false] = params ?? [];

    const mockedUseLabels = jest.spyOn(useLabelsModule, 'useLabels');
    mockedUseLabels.mockReturnValue([value, loading]);

    return mockedUseLabels;
};
