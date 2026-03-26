import { useOrganization } from '@proton/account/organization/hooks';
import { selectActiveCategoriesTabs, selectCategoriesLabel } from '@proton/mail/store/labels/selector';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { useFlag } from '@proton/unleash/useFlag';

export const useCategoriesData = () => {
    const [mailSettings] = useMailSettings();
    const [organization] = useOrganization();

    const categoryViewFlag = useFlag('CategoryView');

    const categoriesStore = useSelector(selectCategoriesLabel);
    const activeCategoriesTabs = useSelector(selectActiveCategoriesTabs);

    const settingAccess = organization?.Settings?.MailCategoryViewEnabled ? !!mailSettings.MailCategoryView : false;
    const categoryViewAccess = categoryViewFlag && settingAccess;

    return {
        categoriesStore,
        activeCategoriesTabs: categoryViewAccess ? activeCategoriesTabs : [],
        categoryViewAccess,
    };
};
