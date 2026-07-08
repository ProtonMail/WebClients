import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { useSystemFolders } from '@proton/mail/store/labels/hooks';
import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { selectLabelIDUnreadCount } from 'proton-mail/hooks/mailboxCounter/useMaiboxCounter.selector';
import { useMailSelector } from 'proton-mail/store/hooks';

import { TabState } from './tabsInterface';

interface Props {
    category: CategoryTab;
    tabState: TabState;
}

export const useCategoriesBadge = ({ category, tabState }: Props) => {
    const [mailSettings] = useMailSettings();
    const [systemFolders] = useSystemFolders();

    const disabledCategoriesIDs = useMailSelector(selectDisabledCategoriesIDs);
    const count = useMailSelector((state) => selectLabelIDUnreadCount(state, category.id));

    const showBadge = useFlag('CategoriesUnseenBadge');

    if (!showBadge) {
        return { shouldShowCounter: false, shouldShowNewBadge: false, count };
    }

    const countersEnabled = mailSettings?.MailCategoryViewCountersEnabled ?? false;
    const isActive = tabState === TabState.ACTIVE;

    const isPrimary = category.id === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT;
    const categoryFolder = systemFolders?.find((folder) => folder.ID === category.id);

    // The primary category folds in the disabled categories, so its unseen state
    // aggregates the default folder and every disabled category folder.
    const primaryCategoryIDs = [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, ...disabledCategoriesIDs];
    const primaryFolders = systemFolders?.filter((folder) => primaryCategoryIDs.includes(folder.ID as CategoryLabelID));

    const hasUnseen = isPrimary
        ? primaryFolders?.some((folder) => (folder.LastUnseenMessageEventID ?? null) !== null)
        : (categoryFolder?.LastUnseenMessageEventID ?? null) !== null;

    return {
        // Counter shows when counters are enabled, and there are unread messages
        shouldShowCounter: countersEnabled && count > 0,
        // Unseen badge shows only when counters are off, the tab is inactive, and there's an unseen event
        shouldShowNewBadge: !!(!countersEnabled && !isActive && hasUnseen),
        count,
    };
};
