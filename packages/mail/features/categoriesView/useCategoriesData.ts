import { selectCategoriesLabel } from '@proton/mail/store/labels/selector';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { useFlag } from '@proton/unleash';

import type { CategoryTab } from './categoriesConstants';
import { getCategoryData } from './categoriesHelpers';

export const useCategoriesData = () => {
    const [mailSettings] = useMailSettings();
    const categoryViewFlag = useFlag('CategoryView');
    const categoriesStore = useSelector(selectCategoriesLabel);

    const categoriesTabs =
        categoriesStore?.map((category): CategoryTab => {
            const data = getCategoryData(category.ID);
            return {
                ...data,
                checked: !!category.Display,
                notify: !!category.Notify,
            };
        }) || [];

    const activeCategoriesTabs = categoriesTabs.filter((category) => category.checked);

    return {
        categoriesStore,
        categoriesTabs,
        activeCategoriesTabs,
        categoryViewAccess: categoryViewFlag && mailSettings?.MailCategoryView,
    };
};
