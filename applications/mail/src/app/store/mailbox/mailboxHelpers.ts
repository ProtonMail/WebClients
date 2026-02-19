import { c, msgid } from 'ttag';

import { isCategoryLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { getLabelName } from '../../helpers/labels';

export const getNotificationTextMarked = ({
    isMessage,
    elementsCount,
    status,
}: {
    isMessage: boolean;
    elementsCount: number;
    status: MARK_AS_STATUS;
}) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return status === MARK_AS_STATUS.READ
                ? c('Success').t`Message marked as read.`
                : c('Success').t`Message marked as unread.`;
        }

        return status === MARK_AS_STATUS.READ
            ? c('Success').ngettext(
                  msgid`${elementsCount} message marked as read.`,
                  `${elementsCount} messages marked as read.`,
                  elementsCount
              )
            : c('Success').ngettext(
                  msgid`${elementsCount} message marked as unread.`,
                  `${elementsCount} messages marked as unread.`,
                  elementsCount
              );
    }

    if (elementsCount === 1) {
        return status === MARK_AS_STATUS.READ
            ? c('Success').t`Conversation marked as read.`
            : c('Success').t`Conversation marked as unread.`;
    }

    return status === MARK_AS_STATUS.READ
        ? c('Success').ngettext(
              msgid`${elementsCount} conversation marked as read.`,
              `${elementsCount} conversations marked as read.`,
              elementsCount
          )
        : c('Success').ngettext(
              msgid`${elementsCount} conversation marked as unread.`,
              `${elementsCount} conversations marked as unread.`,
              elementsCount
          );
};

export const getNotificationTextStarred = ({
    isMessage,
    elementsCount,
}: {
    isMessage: boolean;
    elementsCount: number;
}) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message marked as Starred.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message marked as Starred.`,
            `${elementsCount} messages marked as Starred.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation marked as Starred.`;
    }

    return c('Success').ngettext(
        msgid`${elementsCount} conversation marked as Starred.`,
        `${elementsCount} conversations marked as Starred.`,
        elementsCount
    );
};

export const getNotificationTextUnstarred = ({
    isMessage,
    elementsCount,
}: {
    isMessage: boolean;
    elementsCount: number;
}) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message removed from Starred.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message removed from Starred.`,
            `${elementsCount} messages removed from Starred.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation removed from Starred.`;
    }

    return c('Success').ngettext(
        msgid`${elementsCount} conversation removed from Starred.`,
        `${elementsCount} conversations removed from Starred.`,
        elementsCount
    );
};

export const getNotificationTextLabelRemoved = ({
    isMessage,
    elementsCount,
    destinationLabelID,
    labels,
    folders,
}: {
    isMessage: boolean;
    elementsCount: number;
    destinationLabelID: string;
    labels: Label[];
    folders: Folder[];
}) => {
    if (destinationLabelID === MAILBOX_LABEL_IDS.STARRED) {
        return getNotificationTextUnstarred({ isMessage, elementsCount });
    }

    const labelName = getLabelName(destinationLabelID, labels, folders);

    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message removed from ${labelName}.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message removed from ${labelName}.`,
            `${elementsCount} messages removed from ${labelName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation removed from ${labelName}.`;
    }

    return c('Success').ngettext(
        msgid`${elementsCount} conversation removed from ${labelName}.`,
        `${elementsCount} conversations removed from ${labelName}.`,
        elementsCount
    );
};

export const getNotificationTextLabelAdded = ({
    isMessage,
    elementsCount,
    isComingFromSpam,
    destinationLabelID,
    labels,
    folders,
}: {
    isMessage: boolean;
    elementsCount: number;
    isComingFromSpam: boolean;
    destinationLabelID: string;
    labels: Label[];
    folders: Folder[];
}) => {
    if (destinationLabelID === MAILBOX_LABEL_IDS.STARRED) {
        return getNotificationTextStarred({ isMessage, elementsCount });
    }

    if (isCategoryLabel(destinationLabelID)) {
        return c('Success').ngettext(
            msgid`Recategorized ${elementsCount} message.`,
            `Recategorized ${elementsCount} messages.`,
            elementsCount
        );
    }

    if (destinationLabelID === MAILBOX_LABEL_IDS.SPAM) {
        if (isMessage) {
            if (elementsCount === 1) {
                return c('Success').t`Message moved to spam and sender added to your spam list.`;
            }
            return c('Success').ngettext(
                msgid`${elementsCount} message moved to spam and sender added to your spam list.`,
                `${elementsCount} messages moved to spam and senders added to your spam list.`,
                elementsCount
            );
        } else {
            if (elementsCount === 1) {
                return c('Success').t`Conversation moved to spam and sender added to your spam list.`;
            }
            return c('Success').ngettext(
                msgid`${elementsCount} conversation moved to spam and sender added to your spam list.`,
                `${elementsCount} conversations moved to spam and senders added to your spam list.`,
                elementsCount
            );
        }
    }

    const labelName = getLabelName(destinationLabelID, labels, folders);
    if (isComingFromSpam && destinationLabelID !== MAILBOX_LABEL_IDS.TRASH) {
        if (isMessage) {
            if (elementsCount === 1) {
                return c('Success').t`Message moved to ${labelName} and sender added to your not spam list.`;
            }
            return c('Success').ngettext(
                msgid`${elementsCount} message moved to ${labelName} and sender added to your not spam list.`,
                `${elementsCount} messages moved to ${labelName} and senders added to your not spam list.`,
                elementsCount
            );
        }
        if (elementsCount === 1) {
            return c('Success').t`Conversation moved to ${labelName} and sender added to your not spam list.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} conversation moved to ${labelName} and sender added to your not spam list.`,
            `${elementsCount} conversations moved to ${labelName} and senders added to your not spam list.`,
            elementsCount
        );
    }

    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message moved to ${labelName}.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message moved to ${labelName}.`,
            `${elementsCount} messages moved to ${labelName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation moved to ${labelName}.`;
    }

    return c('Success').ngettext(
        msgid`${elementsCount} conversation moved to ${labelName}.`,
        `${elementsCount} conversations moved to ${labelName}.`,
        elementsCount
    );
};
