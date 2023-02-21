import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useFolders, useMailSettings, useSubscribeEventManager } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { create } from '@proton/shared/lib/helpers/desktopNotification';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isImported } from '@proton/shared/lib/mail/messages';

import notificationIcon from '../../assets/notification.png';
import { isConversationMode } from '../../helpers/mailSettings';
import { setParamsInLocation } from '../../helpers/mailboxUrl';
import { Event } from '../../models/event';

const useNewEmailNotification = (onOpenElement: () => void) => {
    const history = useHistory();
    const [mailSettings] = useMailSettings();
    const [folders = []] = useFolders();
    const notifier = [
        MAILBOX_LABEL_IDS.INBOX,
        MAILBOX_LABEL_IDS.STARRED,
        ...folders.filter(({ Notify }) => Notify).map(({ ID }) => ID),
    ];

    useSubscribeEventManager(({ Messages = [] }: Event) => {
        Messages.filter(
            ({ Action, Message }) =>
                !isImported(Message) &&
                Action === 1 &&
                Message?.Unread === 1 &&
                Message.LabelIDs.some((labelID) => notifier.includes(labelID))
        ).forEach(({ Message }) => {
            const { Subject, Sender, ID, ConversationID, LabelIDs } = Message as Message;
            const sender = Sender.Name || Sender.Address;
            const title = c('Desktop notification title').t`New email received`;
            const labelID = LabelIDs.find((labelID) => notifier.includes(labelID)) || MAILBOX_LABEL_IDS.ALL_MAIL;
            return create(title, {
                body: c('Desktop notification body').t`From: ${sender} - ${Subject}`,
                icon: notificationIcon,
                onClick() {
                    // Remove the search keyword from the URL to find the message or conversation. Otherwise we can have a 'Conversation does not exists' error.
                    const cleanHistoryLocation = { ...history.location, hash: '' };

                    window.focus();
                    history.push(
                        setParamsInLocation(cleanHistoryLocation, {
                            labelID,
                            elementID: isConversationMode(labelID, mailSettings, cleanHistoryLocation)
                                ? ConversationID
                                : ID,
                        })
                    );
                    onOpenElement();
                },
            });
        });
    });
};

export default useNewEmailNotification;
