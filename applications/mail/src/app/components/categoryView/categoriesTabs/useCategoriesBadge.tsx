import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { TabState } from './tabsInterface';

interface Props {
    category: CategoryTab;
    tabState: TabState;
}

export const useCategoriesBadge = ({ tabState }: Props) => {
    const [mailSettings] = useMailSettings();

    const shouldShowCounter = mailSettings.MailCategoryViewCountersEnabled || tabState === TabState.ACTIVE;

    return {
        shouldShowCounter,
    };
};
