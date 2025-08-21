import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings, UserModel } from '@proton/shared/lib/interfaces';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

export const AUTO_DELETE_LABEL_IDS = [MAILBOX_LABEL_IDS.SPAM, MAILBOX_LABEL_IDS.TRASH];

export function isAllowedAutoDeleteLabelID(
    labelID: string
): labelID is typeof MAILBOX_LABEL_IDS.SPAM | typeof MAILBOX_LABEL_IDS.TRASH {
    if (AUTO_DELETE_LABEL_IDS.some((systemFolderId) => systemFolderId === labelID)) {
        return true;
    }
    return false;
}

export function isAutoDeleteEnabled(user: UserModel, mailSettings: MailSettings) {
    return (
        user.hasPaidMail &&
        mailSettings.AutoDeleteSpamAndTrashDays &&
        mailSettings.AutoDeleteSpamAndTrashDays > AUTO_DELETE_SPAM_AND_TRASH_DAYS.DISABLED
    );
}

export function isAutoDeleteExplicitlyDisabled(mailSettings: MailSettings) {
    return mailSettings.AutoDeleteSpamAndTrashDays === AUTO_DELETE_SPAM_AND_TRASH_DAYS.DISABLED;
}

export function isAutoDeleteNotEnabled(user: UserModel, mailSettings: MailSettings) {
    return user.hasPaidMail && mailSettings.AutoDeleteSpamAndTrashDays === null;
}
