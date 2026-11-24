import { vi } from 'vitest';

import * as useCategoriesDataModule from '../features/categoriesView/useCategoriesData';

vi.mock('../features/categoriesView/useCategoriesData', async () => ({
    __esModule: true,
    ...(await vi.importActual('../features/categoriesView/useCategoriesData')),
    useCategoriesData: vi.fn(),
}));

type UseCategoriesDataReturnType = ReturnType<typeof useCategoriesDataModule.useCategoriesData>;

export const mockUseCategoriesData = (params?: Partial<UseCategoriesDataReturnType>) => {
    const value: UseCategoriesDataReturnType = {
        categoriesStore: [],
        activeCategoriesTabs: [],
        isCategoryViewEnabled: false,
        isCategoryViewEnabledSettled: true,
        canUseCategoryView: false,
        ...params,
    };

    const mockedUseCategoriesData = vi.mocked(useCategoriesDataModule.useCategoriesData);
    mockedUseCategoriesData.mockReturnValue(value);

    return mockedUseCategoriesData;
};
