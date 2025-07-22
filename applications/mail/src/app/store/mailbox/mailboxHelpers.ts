import { c, msgid } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

export const getNotificationTextMarked = (isMessage: boolean, elementsCount: number, status: MARK_AS_STATUS) => {
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

export const getNotificationTextStarred = (isMessage: boolean, elementsCount: number) => {
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

export const getNotificationTextUnstarred = (isMessage: boolean, elementsCount: number) => {
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

export const getNotificationTextLabelRemoved = (
    isMessage: boolean,
    elementsCount: number,
    labelID: string,
    labelName: string
) => {
    if (labelID === MAILBOX_LABEL_IDS.STARRED) {
        return getNotificationTextUnstarred(isMessage, elementsCount);
    }

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

export const getNotificationTextLabelAdded = (
    isMessage: boolean,
    elementsCount: number,
    labelID: string,
    labelName: string
) => {
    if (labelID === MAILBOX_LABEL_IDS.STARRED) {
        return getNotificationTextStarred(isMessage, elementsCount);
    }

    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message added to ${labelName}.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message added to ${labelName}.`,
            `${elementsCount} messages added to ${labelName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation added to ${labelName}.`;
    }

    return c('Success').ngettext(
        msgid`${elementsCount} conversation added to ${labelName}.`,
        `${elementsCount} conversations added to ${labelName}.`,
        elementsCount
    );
};
