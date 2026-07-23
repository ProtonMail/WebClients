import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

/**
 * The primary category cannot be disabled, so it never counts towards the enabled categories.
 * A category is the last enabled one when it is the only non-primary category still displayed.
 */
export const isLastEnabledCategory = (activeTabs: CategoryTab[], categoryId: string) => {
    const nonDefaultActive = activeTabs.filter((c) => c.id !== MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);
    return nonDefaultActive.length === 1 && nonDefaultActive[0].id === categoryId;
};
