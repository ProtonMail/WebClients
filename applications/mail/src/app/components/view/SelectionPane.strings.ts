import { c, msgid } from 'ttag';

import { getLabelFromCategoryId } from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import type { CategoryLabelID } from '@proton/shared/lib/constants';

export const getFolderText = (checked: number, count: number, conversationMode: boolean) => {
    if (checked) {
        // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
        return conversationMode
            ? c('Info').ngettext(
                  msgid`You selected **${count} conversation** from this folder`,
                  `You selected **${count} conversations** from this folder`,
                  count
              )
            : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
              c('Info').ngettext(
                  msgid`You selected **${count} message** from this folder`,
                  `You selected **${count} messages** from this folder`,
                  count
              );
    }

    // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
    return conversationMode
        ? c('Info').ngettext(
              msgid`You have **${count} conversation** stored in this folder`,
              `You have **${count} conversations** stored in this folder`,
              count
          )
        : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
          c('Info').ngettext(
              msgid`You have **${count} message** stored in this folder`,
              `You have **${count} messages** stored in this folder`,
              count
          );
};

export const getLabelText = (checked: number, count: number, conversationMode: boolean) => {
    if (checked) {
        // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
        return conversationMode
            ? c('Info').ngettext(
                  msgid`You selected **${count} conversation** with this label`,
                  `You selected **${count} conversations** with this label`,
                  count
              )
            : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
              c('Info').ngettext(
                  msgid`You selected **${count} message** with this label`,
                  `You selected **${count} messages** with this label`,
                  count
              );
    }

    // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. You need to put them in your translation too.
    return conversationMode
        ? c('Info').ngettext(
              msgid`You have **${count} conversation** tagged with this label`,
              `You have **${count} conversations** tagged with this label`,
              count
          )
        : // translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code. Here, "{count} message/s" will be bold. You need to put them in your translation too.
          c('Info').ngettext(
              msgid`You have **${count} message** tagged with this label`,
              `You have **${count} messages** tagged with this label`,
              count
          );
};

export const getCategoryText = (
    checked: number,
    count: number,
    conversationMode: boolean,
    categoryID: CategoryLabelID
) => {
    if (count === 0) {
        return conversationMode
            ? c('Info').t`You have no conversations in this category`
            : c('Info').t`You have no messages in this category`;
    }

    const categoryLabel = getLabelFromCategoryId(categoryID);

    if (checked) {
        return conversationMode
            ? c('Info').ngettext(
                  msgid`You selected **${checked} conversation** in your ${categoryLabel} category`,
                  `You selected **${checked} conversations** in your ${categoryLabel} category`,
                  checked
              )
            : c('Info').ngettext(
                  msgid`You selected **${checked} message** in your ${categoryLabel} category`,
                  `You selected **${checked} messages** in your ${categoryLabel} category`,
                  checked
              );
    }

    // translator: To have plural forms AND a part in bold, we surround the bold part with "**" so it can be replaced by a <strong> tag in the code. Here, "{count} conversation/s" will be bold. ${categoryLabel} is the localized category name (e.g. Social). You need to keep both in your translation.
    return conversationMode
        ? c('Info').ngettext(
              msgid`You have **${count} conversation** in your ${categoryLabel} category`,
              `You have **${count} conversations** in your ${categoryLabel} category`,
              count
          )
        : // translator: same as above but for messages.
          c('Info').ngettext(
              msgid`You have **${count} message** in your ${categoryLabel} category`,
              `You have **${count} messages** in your ${categoryLabel} category`,
              count
          );
};
