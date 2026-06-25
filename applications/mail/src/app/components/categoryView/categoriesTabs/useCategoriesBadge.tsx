import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { useSystemFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useFlag } from '@proton/unleash/useFlag';

import { TabState } from './tabsInterface';

interface Props {
    category: CategoryTab;
    tabState: TabState;
}

export const useCategoriesBadge = ({ category, tabState }: Props) => {
    const [mailSettings] = useMailSettings();
    const [systemFolders] = useSystemFolders();

    const showBadge = useFlag('CategoriesUnseenBadge');

    if (!showBadge) {
        return { shouldShowCounter: false, shouldShowNewBadge: false };
    }

    const countersEnabled = mailSettings?.MailCategoryViewCountersEnabled ?? false;
    const isActive = tabState === TabState.ACTIVE;

    const categoryFolder = systemFolders?.find((folder) => folder.ID === category.id);
    const hasUnseen = (categoryFolder?.LastUnseenMessageEventID ?? null) !== null;

    return {
        // Counter shows when counters are enabled, or for the active tab
        shouldShowCounter: countersEnabled || isActive,
        // Unseen badge shows only when counters are off, the tab is inactive, and there's an unseen event
        shouldShowNewBadge: !countersEnabled && !isActive && hasUnseen,
    };
};
