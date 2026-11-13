import { useFlagsStatus } from '@unleash/proxy-client-react';

import { baseUseSelector } from '@proton/react-redux-store/ProtonStoreContext';
import { useFlag } from '@proton/unleash/useFlag';

import {
    selectCategoryViewLoading,
    selectCategoryViewSettingAccess,
} from '../../store/categoriesView/categoriesViewSelector';
import { selectActiveCategoriesTabs, selectCategoriesLabel } from '../../store/labels/selector';
import type { CategoryTab } from './categoriesConstants';

const EMPTY_ARRAY: CategoryTab[] = [];

export const useCategoriesData = () => {
    const { flagsReady } = useFlagsStatus();
    const isCategoryViewDisabled = useFlag('CategoryViewDisabled');
    const categoryViewFlag = !isCategoryViewDisabled;

    const isLoading = baseUseSelector(selectCategoryViewLoading);
    const settingAccess = baseUseSelector(selectCategoryViewSettingAccess);
    const categoriesStore = baseUseSelector(selectCategoriesLabel);
    const activeCategoriesTabs = baseUseSelector(selectActiveCategoriesTabs);

    const isCategoryViewEnabled = categoryViewFlag && settingAccess;

    // Redirect decisions must wait until every input behind `categoryViewAccess` has loaded.
    const isCategoryViewEnabledSettled = !isLoading && flagsReady;

    return {
        canUseCategoryView: categoryViewFlag,
        categoriesStore,
        activeCategoriesTabs: isCategoryViewEnabled ? activeCategoriesTabs : EMPTY_ARRAY,
        isCategoryViewEnabled,
        isCategoryViewEnabledSettled,
    };
};
