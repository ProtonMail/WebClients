import { c } from 'ttag';

import type { CategoryTab } from '@proton/mail';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getLabelFromCategoryId } from '../categoryView/categoriesStringHelpers';

export const getInboxCategoriesItems = ({
    canMoveToInbox,
    shouldShowTabs,
    activeCategoriesTabs,
}: {
    canMoveToInbox: boolean;
    shouldShowTabs: boolean;
    activeCategoriesTabs: CategoryTab[];
}) => {
    if (!canMoveToInbox) {
        return [];
    }

    const inboxItem = {
        ID: MAILBOX_LABEL_IDS.INBOX,
        Name: c('Mailbox').t`Inbox`,
        icon: 'inbox',
    };

    if (shouldShowTabs) {
        return activeCategoriesTabs.length > 0
            ? activeCategoriesTabs.map((category) => ({
                  ID: category.id,
                  Name: getLabelFromCategoryId(category.id),
                  icon: category.icon,
                  level: category.id === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT ? 0 : 1,
                  folderIconProps: {
                      className: 'mail-category-color',
                      color: category.colorShade,
                  },
              }))
            : [inboxItem];
    }

    return [inboxItem];
};
