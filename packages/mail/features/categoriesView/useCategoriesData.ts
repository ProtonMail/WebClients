import { useOrganization } from '@proton/account/organization/hooks';
import {
    selectActiveCategoriesTabs,
    selectCategoriesLabel,
    selectCategoriesTabs,
    selectDisabledCategoriesIDs,
} from '@proton/mail/store/labels/selector';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { useFlag } from '@proton/unleash';

export const useCategoriesData = () => {
    const [mailSettings] = useMailSettings();
    const [organization] = useOrganization();

    const categoryViewFlag = useFlag('CategoryView');

    const categoriesStore = useSelector(selectCategoriesLabel);
    const categoriesTabs = useSelector(selectCategoriesTabs);
    const activeCategoriesTabs = useSelector(selectActiveCategoriesTabs);
    const disabledCategoriesIDs = useSelector(selectDisabledCategoriesIDs);

    const settingAccess = organization?.Settings?.MailCategoryViewEnabled ? !!mailSettings.MailCategoryView : false;
    const categoryViewAccess = categoryViewFlag && settingAccess;

    return {
        categoriesStore,
        categoriesTabs: categoryViewAccess ? categoriesTabs : [],
        activeCategoriesTabs: categoryViewAccess ? activeCategoriesTabs : [],
        disabledCategoriesIDs: categoryViewAccess ? disabledCategoriesIDs : [],
        categoryViewAccess,
    };
};
