import type { History } from 'history';
import { c } from 'ttag';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { create, createElectronNotification } from '@proton/shared/lib/helpers/desktopNotification';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import generateUID from '@proton/utils/generateUID';

import notificationIcon from '../../../assets/notification.png';
import { isConversationMode } from '../../../helpers/mailSettings';
import { setParamsInLocation } from '../../../helpers/mailboxUrl';

export const displayNotification = ({
    message,
    history,
    mailSettings,
    notifier,
    onOpenElement,
}: {
    message: Message;
    history: History<unknown>;
    mailSettings: any;
    notifier: any;
    onOpenElement: () => void;
}) => {
    const { Subject, Sender, ID, ConversationID, LabelIDs } = message;
    const sender = Sender.Name || Sender.Address;
    const title = c('Desktop notification title').t`New email received`;
    const body = c('Desktop notification body').t`From: ${sender} - ${Subject}`;
    const labelID = LabelIDs.find((labelID) => notifier.includes(labelID)) || MAILBOX_LABEL_IDS.ALL_MAIL;

    // Remove the search keyword from the URL to find the message or conversation. Otherwise we can have a 'Conversation does not exists' error.
    const cleanHistoryLocation = { ...history.location, hash: '' };
    const elementID = isConversationMode(labelID, mailSettings, cleanHistoryLocation) ? ConversationID : ID;
    const location = setParamsInLocation(cleanHistoryLocation, { labelID, elementID });

    if (isElectronMail) {
        return createElectronNotification({ title, body, app: 'mail', labelID, elementID });
    }

    return create(title, {
        tag: ID,
        body,
        icon: notificationIcon,
        onClick() {
            window.focus();
            history.push(location);
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
