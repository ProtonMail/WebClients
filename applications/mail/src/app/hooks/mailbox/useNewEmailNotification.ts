import { isImported } from 'proton-shared/lib/mail/messages';
import { useHistory } from 'react-router-dom';
import { useFolders, useMailSettings, useSubscribeEventManager } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { create } from 'proton-shared/lib/helpers/desktopNotification';
import { c } from 'ttag';

import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { Event } from '../../models/event';
import { isConversationMode } from '../../helpers/mailSettings';
import { setParamsInLocation } from '../../helpers/mailboxUrl';
import notificationIcon from '../../assets/notification.gif';

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
                    window.focus();
                    history.push(
                        setParamsInLocation(history.location, {
                            labelID,
                            elementID: isConversationMode(labelID, mailSettings, history.location)
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
