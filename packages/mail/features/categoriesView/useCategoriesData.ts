import { useOrganization } from '@proton/account/organization/hooks';
import { selectCategoriesLabel } from '@proton/mail/store/labels/selector';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { useFlag } from '@proton/unleash';

import type { CategoryTab } from './categoriesConstants';
import { getCategoryData } from './categoriesHelpers';

export const useCategoriesData = () => {
    const [mailSettings] = useMailSettings();
    const [organization] = useOrganization();

    const categoryViewFlag = useFlag('CategoryView');
    const categoriesStore = useSelector(selectCategoriesLabel);

    const categoriesTabs =
        categoriesStore?.map((category): CategoryTab => {
            const data = getCategoryData(category.ID);
            return {
                ...data,
                display: !!category.Display,
                notify: !!category.Notify,
            };
        }) || [];

    const activeCategoriesTabs = categoriesTabs.filter((category) => category.display);

    const settingAccess = organization?.Settings?.MailCategoryViewEnabled ? !!mailSettings.MailCategoryView : false;
    const categoryViewAccess = categoryViewFlag && settingAccess;

    return {
        categoriesStore,
        categoriesTabs: categoryViewAccess ? categoriesTabs : [],
        activeCategoriesTabs: categoryViewAccess ? activeCategoriesTabs : [],
        categoryViewAccess,
    };
};
