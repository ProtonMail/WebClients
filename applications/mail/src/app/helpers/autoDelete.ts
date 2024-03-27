import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MailSettings, UserModel } from '@proton/shared/lib/interfaces';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';

const { SPAM, TRASH } = MAILBOX_LABEL_IDS;

export const AUTO_DELETE_LABEL_IDS = [SPAM, TRASH];

export function isAllowedAutoDeleteLabelID(labelID: string): labelID is typeof SPAM | typeof TRASH {
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
