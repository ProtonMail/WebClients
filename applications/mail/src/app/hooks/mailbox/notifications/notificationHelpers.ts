import type { History } from 'history';
import { c } from 'ttag';

import { isCategoryLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { create, createElectronNotification } from '@proton/shared/lib/helpers/desktopNotification';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import generateUID from '@proton/utils/generateUID';

import notificationIcon from '../../../assets/notification.png';
import { isConversationMode } from '../../../helpers/mailSettings';
import { setParamsInLocation } from '../../../helpers/mailboxUrl';

export const prepareNotificationData = ({
    message,
    history,
    mailSettings,
    notifier,
    categoryViewAccess,
}: {
    message: Message;
    history: History<unknown>;
    mailSettings: MailSettings;
    notifier: string[];
    categoryViewAccess: boolean;
}) => {
    const { Subject, Sender, ID, ConversationID, LabelIDs } = message;
    const sender = Sender.Name || Sender.Address;
    const title = c('Desktop notification title').t`New email received`;
    const body = c('Desktop notification body').t`From: ${sender} - ${Subject}`;

    let labelID = LabelIDs.find((labelID) => notifier.includes(labelID)) || MAILBOX_LABEL_IDS.ALL_MAIL;
    if (labelID === MAILBOX_LABEL_IDS.INBOX && categoryViewAccess) {
        const categoryLabel = LabelIDs.find(isCategoryLabel);
        if (categoryLabel && notifier.includes(categoryLabel)) {
            labelID = categoryLabel;
        } else {
            // This prevents from showing a notification that would redirect users to Inbox and break the UI
            labelID = MAILBOX_LABEL_IDS.ALL_MAIL;
        }
        // Fallback case, when categories are disabled we redirect to Inbox
    } else if (isCategoryLabel(labelID) && !categoryViewAccess) {
        labelID = MAILBOX_LABEL_IDS.INBOX;
    }

    // Remove the search keyword from the URL to find the message or conversation. Otherwise we can have a 'Conversation does not exists' error.
    const cleanHistoryLocation = { ...history.location, hash: '' };
    const conversationMode = isConversationMode(labelID, mailSettings, cleanHistoryLocation);
    const elementID = conversationMode ? ConversationID : ID;
    const messageID = conversationMode ? ID : undefined;
    const location = setParamsInLocation(cleanHistoryLocation, { labelID, elementID, messageID });

    return { title, body, location, ID, labelID, elementID, messageID };
};

export const displayNotification = ({
    message,
    history,
    mailSettings,
    notifier,
    onOpenElement,
    categoryViewAccess,
}: {
    message: Message;
    history: History<unknown>;
    mailSettings: MailSettings;
    notifier: string[];
    onOpenElement: () => void;
    categoryViewAccess: boolean;
}) => {
    const notificationData = prepareNotificationData({
        message,
        history,
        mailSettings,
        notifier,
        categoryViewAccess,
    });

    if (isElectronMail) {
        return createElectronNotification({ app: 'mail', ...notificationData });
    }

    return create(notificationData.title, {
        tag: notificationData.ID,
        body: notificationData.body,
        icon: notificationIcon,
        onClick() {
            window.focus();
            history.push(notificationData.location);
            onOpenElement();
        },
    });
};

export const displayGrouppedNotification = ({
    body,
    history,
    onOpenElement,
}: {
    body: string;
    history: History<unknown>;
    onOpenElement: () => void;
}) => {
    const ID = generateUID('groupped-notification');
    const title = c('Desktop notification title').t`New email received`;

    if (isElectronMail) {
        return createElectronNotification({ title, body, app: 'mail' });
    }

    return create(title, {
        tag: ID,
        body,
        icon: notificationIcon,
        onClick() {
            window.focus();
            history.push('all-mail');
            onOpenElement();
        },
    });
};
