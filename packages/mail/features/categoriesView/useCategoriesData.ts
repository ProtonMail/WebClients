import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import {
    selectCategoryViewLoading,
    selectCategoryViewSettingAccess,
} from '@proton/mail/store/categoriesView/categoriesViewSelector';
import { selectActiveCategoriesTabs, selectCategoriesLabel } from '@proton/mail/store/labels/selector';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { useFlagsStatus } from '@proton/unleash/proxy';
import { useFlag } from '@proton/unleash/useFlag';

import type { CategoryTab } from './categoriesConstants';

const EMPTY_ARRAY: CategoryTab[] = [];

export const useCategoriesData = () => {
    const { flagsReady } = useFlagsStatus();
    const categoryViewFlag = useFlag('CategoryView');
    const betaFlag = useFeature<boolean>(FeatureCode.CategoryViewBeta);
    const hasBetaAccess = betaFlag.feature?.Value ?? false;

    const isLoading = useSelector(selectCategoryViewLoading);
    const settingAccess = useSelector(selectCategoryViewSettingAccess);
    const categoriesStore = useSelector(selectCategoriesLabel);
    const activeCategoriesTabs = useSelector(selectActiveCategoriesTabs);

    const canUseCategoryView = categoryViewFlag || hasBetaAccess;
    const isCategoryViewEnabled = canUseCategoryView && settingAccess;

    const isRefreshedToolbarUIDisabled = useFlag('NewToolbarKillSwitch');
    const shouldSeeWideToolbars = canUseCategoryView ? !isRefreshedToolbarUIDisabled : false;

    // Redirect decisions must wait until every input behind `categoryViewAccess` has loaded.
    const isCategoryViewEnabledSettled = !isLoading && !betaFlag.loading && flagsReady;

    return {
        canUseCategoryView,
        categoriesStore,
        activeCategoriesTabs: isCategoryViewEnabled ? activeCategoriesTabs : EMPTY_ARRAY,
        isCategoryViewEnabled,
        isCategoryViewEnabledSettled,
        shouldSeeWideToolbars,
    };
};
