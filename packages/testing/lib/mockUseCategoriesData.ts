import * as useCategoriesDataModule from '@proton/mail/features/categoriesView/useCategoriesData';

type UseCategoriesDataReturnType = ReturnType<typeof useCategoriesDataModule.useCategoriesData>;

export const mockUseCategoriesData = (params?: Partial<UseCategoriesDataReturnType>) => {
    const value: UseCategoriesDataReturnType = {
        categoriesStore: [],
        categoriesTabs: [],
        activeCategoriesTabs: [],
        disabledCategoriesIDs: [],
        categoryViewAccess: false,
        ...params,
    };

    const mockedUseCategoriesData = jest.spyOn(useCategoriesDataModule, 'useCategoriesData');
    mockedUseCategoriesData.mockReturnValue(value);

    return mockedUseCategoriesData;
};
