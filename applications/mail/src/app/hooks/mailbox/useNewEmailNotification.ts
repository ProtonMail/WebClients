import { useHistory } from 'react-router-dom';

import type { History } from 'history';
import { c } from 'ttag';

import { useSubscribeEventManager } from '@proton/components';
import { useFolders } from '@proton/mail';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { create } from '@proton/shared/lib/helpers/desktopNotification';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isImported } from '@proton/shared/lib/mail/messages';

import notificationIcon from '../../assets/notification.png';
import { isConversationMode } from '../../helpers/mailSettings';
import { setParamsInLocation } from '../../helpers/mailboxUrl';
import { isElementReminded } from '../../helpers/snooze';
import useMailModel from '../../hooks/useMailModel';
import type { Event } from '../../models/event';

const displayNotification = (
    Message: Message,
    history: History<unknown>,
    mailSettings: any,
    notifier: any,
    onOpenElement: () => void
) => {
    const { Subject, Sender, ID, ConversationID, LabelIDs } = Message;
    const sender = Sender.Name || Sender.Address;
    const title = c('Desktop notification title').t`New email received`;
    const body = c('Desktop notification body').t`From: ${sender} - ${Subject}`;
    const labelID = LabelIDs.find((labelID) => notifier.includes(labelID)) || MAILBOX_LABEL_IDS.ALL_MAIL;

    // Remove the search keyword from the URL to find the message or conversation. Otherwise we can have a 'Conversation does not exists' error.
    const cleanHistoryLocation = { ...history.location, hash: '' };
    const elementID = isConversationMode(labelID, mailSettings, cleanHistoryLocation) ? ConversationID : ID;
    const location = setParamsInLocation(cleanHistoryLocation, { labelID, elementID });

    return create(
        title,
        {
            tag: ID,
            body,
            icon: notificationIcon,
            onClick() {
                window.focus();
                history.push(location);
                onOpenElement();
            },
        },
        // Used for Electron notifications on the Mail desktop app
        { title, body, app: 'mail', elementID, labelID }
    );
};

const useNewEmailNotification = (onOpenElement: () => void) => {
    const history = useHistory();
    const mailSettings = useMailModel('MailSettings');
    const [folders = []] = useFolders();
    const notifier = [
        MAILBOX_LABEL_IDS.INBOX,
        MAILBOX_LABEL_IDS.STARRED,
        ...folders.filter(({ Notify }) => Notify).map(({ ID }) => ID),
    ];

    useSubscribeEventManager(({ Messages = [], Conversations = [] }: Event) => {
        Messages.filter(
            ({ Action, Message }) =>
                !isImported(Message) &&
                Action === 1 &&
                Message?.Unread === 1 &&
                Message.LabelIDs.some((labelID) => notifier.includes(labelID))
        ).forEach(({ Message }) => {
            displayNotification(Message as Message, history, mailSettings, notifier, onOpenElement);
        });

        // Used to display the notification for the reminded messages
        Conversations.filter(
            ({ Action, Conversation }) =>
                Action === 3 &&
                isElementReminded(Conversation) &&
                Conversation?.LabelIDsRemoved?.includes(MAILBOX_LABEL_IDS.SNOOZED)
        ).forEach(({ Conversation }) => {
            const notificationToDisplay = new Map<string, Message>();

            // We only want to display one notification for the latest message of a conversation
            Messages.filter(({ Message }) => Message?.ConversationID === Conversation?.ID).forEach(({ Message }) => {
                if (!Message || !Message.ID || !Conversation || !Conversation.ID) {
                    return;
                }

                if (!notificationToDisplay.has(Conversation.ID)) {
                    notificationToDisplay.set(Conversation.ID, Message);
                    return;
                }

                const currentMessage = notificationToDisplay.get(Conversation.ID);
                if (!currentMessage) {
                    return;
                }

                if (Message.Time > currentMessage?.Time) {
                    notificationToDisplay.set(Conversation.ID, Message);
                }
            });

            notificationToDisplay.forEach((value) => {
                displayNotification(value, history, mailSettings, notifier, onOpenElement);
            });
        });
    });
};

export default useNewEmailNotification;
