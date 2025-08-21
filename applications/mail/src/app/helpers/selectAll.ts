import { c, msgid } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';

import { getLabelName } from './labels';

export const getSelectAllBannerText = (conversationMode: boolean, elementsCount: number) => {
    /* translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code.
     * Here, "{elementsCount} conversations" or "{elementsCount} messages" will be bold. You need to put them in your translation too.
     * ${elementsCount} is the number of elements selected by the user
     * Full string for reference: "You selected 3 conversations" or "You selected 3 messages"
     */
    return conversationMode
        ? c('Info').ngettext(
              msgid`You selected **${elementsCount} conversation**.`,
              `You selected **${elementsCount} conversations**.`,
              elementsCount
          )
        : c('Info').ngettext(
              msgid`You selected **${elementsCount} message**.`,
              `You selected **${elementsCount} messages**.`,
              elementsCount
          );
};

export const getSelectAllBannerTextWithLocation = (
    conversationMode: boolean,
    elementsCount: number,
    labelID: string,
    customLabels: Label[],
    customFolders: Folder[]
) => {
    const location = getLabelName(labelID, customLabels, customFolders);

    /* translator: To have plural forms AND a part in bold, we need to surround the bold part with "**" so that we can replace it by a <strong> tag in the code.
     * Here, "{elementsCount} conversations" or "{elementsCount} messages" will be bold. You need to put them in your translation too.
     * ${elementsCount} is the number of elements selected by the user
     * ${location} current location (e.g. inbox, trash, etc...)
     * Full string for reference: "You selected 3 conversations in Inbox" or "You selected 3 messages in Inbox"
     */
    return conversationMode
        ? c('Info').ngettext(
              msgid`You selected **${elementsCount} conversation** in ${location}`,
              `You selected **${elementsCount} conversations** in ${location}`,
              elementsCount
          )
        : c('Info').ngettext(
              msgid`You selected **${elementsCount} message** in ${location}`,
              `You selected **${elementsCount} messages** in ${location}`,
              elementsCount
          );
};

export const getSelectAllButtonText = (
    selectAll: boolean,
    elementsCount: number,
    labelID: string,
    customLabels: Label[],
    customFolders: Folder[]
) => {
    if (selectAll) {
        return c('Info').t`Clear selection`;
    }
    const location = getLabelName(labelID, customLabels, customFolders);
    /* translator:
     * ${elementsCount} is the number of elements in the location
     * ${labelName} is the name of the current label/folder
     * Full string for reference: Select all 999 in inbox
     */
    return c('Info').ngettext(
        msgid`Select all ${elementsCount} in ${location}`,
        `Select all ${elementsCount} in ${location}`,
        elementsCount
    );
};

export const getSelectAllNotificationText = (isMessage: boolean) => {
    return isMessage ? c('Info').t`Applying actions to messages` : c('Info').t`Applying actions to conversations`;
};

export const getCanDisplaySelectAllBanner = ({
    selectAllFeatureAvailable,
    mailPageSize,
    checkedIDs,
    labelID,
    isSearch,
    hasFilter,
}: {
    selectAllFeatureAvailable: boolean;
    mailPageSize: number;
    checkedIDs: string[];
    labelID: string;
    isSearch: boolean;
    hasFilter: boolean;
}) => {
    const unauthorizedSelectAllLabelIDs = [MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL];

    return (
        selectAllFeatureAvailable &&
        checkedIDs?.length === mailPageSize &&
        !unauthorizedSelectAllLabelIDs.includes(labelID as MAILBOX_LABEL_IDS) &&
        !isSearch &&
        !hasFilter
    );
};
