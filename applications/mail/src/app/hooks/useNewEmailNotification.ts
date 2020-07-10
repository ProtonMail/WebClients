import { useEffect } from 'react';
import { Location, History } from 'history';
import { useFolders, useMailSettings } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { create, isEnabled, request } from 'proton-shared/lib/helpers/desktopNotification';
import { c } from 'ttag';

import { useSubscribeEventManager } from './useHandler';
import { Event } from '../models/event';
import { isImported } from '../helpers/message/messages';
import { isConversationMode } from '../helpers/mailSettings';
import { setPathInUrl } from '../helpers/mailboxUrl';
import notificationIcon from '../assets/notification.gif';

const useNewEmailNotification = (history: History, location: Location) => {
    const [mailSettings] = useMailSettings();
    const [folders = []] = useFolders();
    const notifier = [
        MAILBOX_LABEL_IDS.INBOX,
        MAILBOX_LABEL_IDS.STARRED,
        ...folders.filter(({ Notify }) => Notify).map(({ ID }) => ID)
    ];

    useSubscribeEventManager(({ Messages = [] }: Event) => {
        Messages.filter(
            ({ Action, Message }) =>
                !isImported(Message) &&
                Action === 1 &&
                Message.Unread === 1 &&
                Message.LabelIDs.some((labelID) => notifier.includes(labelID))
        ).forEach(({ Message }) => {
            const { Subject, Sender, ID, ConversationID, LabelIDs } = Message;
            const sender = Sender.Name || Sender.Address;
            const title = c('Desktop notification title').t`New email received`;
            const labelID = LabelIDs.find((labelID) => notifier.includes(labelID)) || MAILBOX_LABEL_IDS.ALL_MAIL;
            return create(title, {
                body: c('Desktop notification body').t`From: ${sender} - ${Subject}`,
                icon: notificationIcon,
                onClick() {
                    window.focus();

                    if (isConversationMode(labelID, mailSettings, location)) {
                        return history.push(setPathInUrl(location, labelID, ConversationID));
                    }

                    history.push(setPathInUrl(location, labelID, ID));
                }
            });
        });
    });

    useEffect(() => {
        if (!isEnabled()) {
            request();
        }
    }, []);
};

export default useNewEmailNotification;
