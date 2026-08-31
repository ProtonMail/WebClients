import * as useCategoriesDataModule from '../features/categoriesView/useCategoriesData';

jest.mock('../features/categoriesView/useCategoriesData', () => ({
    __esModule: true,
    ...jest.requireActual('../features/categoriesView/useCategoriesData'),
    useCategoriesData: jest.fn(),
}));

type UseCategoriesDataReturnType = ReturnType<typeof useCategoriesDataModule.useCategoriesData>;

export const mockUseCategoriesData = (params?: Partial<UseCategoriesDataReturnType>) => {
    const value: UseCategoriesDataReturnType = {
        categoriesStore: [],
        activeCategoriesTabs: [],
        isCategoryViewEnabled: false,
        isCategoryViewEnabledSettled: true,
        shouldSeeWideToolbars: false,
        canUseCategoryView: false,
        ...params,
    };

    const mockedUseCategoriesData = jest.mocked(useCategoriesDataModule.useCategoriesData);
    mockedUseCategoriesData.mockReturnValue(value);

    return mockedUseCategoriesData;
};
