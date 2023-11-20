import { useHistory } from 'react-router-dom';

import { History } from 'history';
import { c } from 'ttag';

import { useFolders, useSubscribeEventManager } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { create } from '@proton/shared/lib/helpers/desktopNotification';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isImported } from '@proton/shared/lib/mail/messages';

import notificationIcon from '../../assets/notification.png';
import { isConversationMode } from '../../helpers/mailSettings';
import { setParamsInLocation } from '../../helpers/mailboxUrl';
import useMailModel from '../../hooks/useMailModel';
import { isElementReminded } from '../../logic/snoozehelpers';
import { Event } from '../../models/event';

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
    const labelID = LabelIDs.find((labelID) => notifier.includes(labelID)) || MAILBOX_LABEL_IDS.ALL_MAIL;
    return create(title, {
        tag: ID,
        body: c('Desktop notification body').t`From: ${sender} - ${Subject}`,
        icon: notificationIcon,
        onClick() {
            // Remove the search keyword from the URL to find the message or conversation. Otherwise we can have a 'Conversation does not exists' error.
            const cleanHistoryLocation = { ...history.location, hash: '' };

            window.focus();
            history.push(
                setParamsInLocation(cleanHistoryLocation, {
                    labelID,
                    elementID: isConversationMode(labelID, mailSettings, cleanHistoryLocation) ? ConversationID : ID,
                })
            );
            onOpenElement();
        },
    });
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
        Conversations.filter(({ Action, Conversation }) => Action === 3 && isElementReminded(Conversation)).forEach(
            ({ Conversation }) => {
                Messages.filter(({ Message }) => Message?.ConversationID === Conversation?.ID).forEach(({ Message }) =>
                    displayNotification(Message as Message, history, mailSettings, notifier, onOpenElement)
                );
            }
        );
    });
};

export default useNewEmailNotification;
