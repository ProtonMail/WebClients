import { c } from 'ttag';

import type { LabelModel } from '@proton/components';
import type { CategoryTab } from '@proton/mail';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { FolderItem } from 'proton-mail/hooks/useMailTreeView/interface';

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

export const toFolderItem = (label: LabelModel): FolderItem => ({
    ID: label.ID ?? '',
    Path: label.Path ?? '',
    Order: label.Order ?? 0,
    Notify: label.Notify ?? 0,
    Name: label.Name,
    Color: label.Color,
    color: label.Color,
    Expanded: 0,
    Type: label.Type,
    icon: 'folder',
    level: 0,
});
