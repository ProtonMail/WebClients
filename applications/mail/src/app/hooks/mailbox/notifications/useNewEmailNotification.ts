import { useHistory } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { useSubscribeEventManager } from '@proton/components';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import { useFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { EVENT_ACTIONS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isWindows } from '@proton/shared/lib/helpers/browser';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isImported } from '@proton/shared/lib/mail/messages';

import { isElementReminded } from '../../../helpers/snooze';
import type { ConversationEvent, Event, MessageEvent } from '../../../models/event';
import { displayGroupedNotification, displayNotification } from './notificationHelpers';

const MAX_WINDOWS_NOTIFICATIONS = 3;

const messageFilter = (event: MessageEvent, notifier: string[], categoryViewAccess: boolean): boolean => {
    const { Action, Message } = event;

    const messageHasInboxLabel = Message?.LabelIDs.includes(MAILBOX_LABEL_IDS.INBOX);
    const areNotifationsEnabledForlabel = !!(messageHasInboxLabel && categoryViewAccess
        ? Message?.LabelIDs.filter(isCategoryLabel).some((labelID) => notifier.includes(labelID))
        : Message?.LabelIDs.some((labelID) => notifier.includes(labelID)));

    return (
        !isImported(Message) &&
        Action === EVENT_ACTIONS.CREATE &&
        Message?.Unread === 1 &&
        areNotifationsEnabledForlabel
    );
};

const isConversationUnsnoozed = (event: ConversationEvent): boolean => {
    const { Action, Conversation } = event;
    return (
        Action === EVENT_ACTIONS.UPDATE_FLAGS &&
        isElementReminded(Conversation) &&
        !!Conversation?.LabelIDsRemoved?.includes(MAILBOX_LABEL_IDS.SNOOZED)
    );
};

const useNewEmailNotification = (onOpenElement: () => void) => {
    const history = useHistory();
    const [mailSettings] = useMailSettings();
    const [folders = []] = useFolders();
    const { categoryViewAccess, activeCategoriesTabs } = useCategoriesData();

    const notifier = [
        MAILBOX_LABEL_IDS.INBOX,
        MAILBOX_LABEL_IDS.STARRED,
        ...folders.filter(({ Notify }) => Notify).map(({ ID }) => ID),
    ];

    if (categoryViewAccess) {
        activeCategoriesTabs
            .filter((category) => category.notify)
            .forEach((category) => {
                notifier.push(category.id);
            });
    }

    // Regular messages notification
    useSubscribeEventManager(({ Messages = [] }: Event) => {
        const notificationsToShow = Messages.filter((event) => messageFilter(event, notifier, categoryViewAccess)).map(
            ({ Message }) => {
                if (Message) {
                    return Message;
                }
            }
        ) as Message[];

        if (isWindows() && notificationsToShow.length > MAX_WINDOWS_NOTIFICATIONS) {
            void displayGroupedNotification({
                body: c('Desktop notification body').ngettext(
                    msgid`${notificationsToShow.length} new message`,
                    `${notificationsToShow.length} new messages`,
                    notificationsToShow.length
                ),
                history,
                onOpenElement,
            });
        } else {
            notificationsToShow.forEach((value) => {
                void displayNotification({
                    message: value,
                    history,
                    mailSettings,
                    notifier,
                    onOpenElement,
                    categoryViewAccess,
                });
            });
        }
    });

    // Used to display the notification for the reminded messages (once the snooze period is over)
    useSubscribeEventManager(({ Messages = [], Conversations = [] }: Event) => {
        Conversations.filter(isConversationUnsnoozed).forEach(({ Conversation }) => {
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
                void displayNotification({
                    message: value,
                    history,
                    mailSettings,
                    notifier,
                    onOpenElement,
                    categoryViewAccess,
                });
            });
        });
    });
};

export default useNewEmailNotification;
