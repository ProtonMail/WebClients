import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { baseUseSelector } from '@proton/react-redux-store';
import type { CategoryViewVariantVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';
import { useFlagsStatus } from '@proton/unleash/proxy';
import { useFlag } from '@proton/unleash/useFlag';
import { useVariant } from '@proton/unleash/useVariant';

import {
    selectCategoryViewLoading,
    selectCategoryViewSettingAccess,
} from '../../store/categoriesView/categoriesViewSelector';
import { selectActiveCategoriesTabs, selectCategoriesLabel } from '../../store/labels/selector';
import type { CategoryTab } from './categoriesConstants';

const EMPTY_ARRAY: CategoryTab[] = [];

type CategoryViewVariantName = CategoryViewVariantVariant | 'disabled';

const variantWithAccess = new Set<CategoryViewVariantName>([
    'FeatureAccessOn',
    'PrimaryFiltering45',
    'PrimaryFiltering60',
    'RecategorizationButton',
    'RecategorizationNoButton',
    'GradualRollout',
]);

export const useCategoriesData = () => {
    const { flagsReady } = useFlagsStatus();
    const categoryViewFlag = useFlag('CategoryView');
    const betaFlag = useFeature<boolean>(FeatureCode.CategoryViewBeta);
    const hasBetaAccess = betaFlag.feature?.Value ?? false;

    const flagVariant = useVariant('CategoryViewVariant');
    const variantWithCategoryViewAccess = flagVariant.name ? variantWithAccess.has(flagVariant.name) : false;

    const isLoading = baseUseSelector(selectCategoryViewLoading);
    const settingAccess = baseUseSelector(selectCategoryViewSettingAccess);
    const categoriesStore = baseUseSelector(selectCategoriesLabel);
    const activeCategoriesTabs = baseUseSelector(selectActiveCategoriesTabs);

    const canUseCategoryView = categoryViewFlag || hasBetaAccess || variantWithCategoryViewAccess;
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
