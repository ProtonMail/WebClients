import type { History, Location } from 'history';
import { c, msgid } from 'ttag';

import { isCategoryLabel } from '@proton/mail/helpers/location';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { create, createElectronNotification } from '@proton/shared/lib/helpers/desktopNotification';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';
import generateUID from '@proton/utils/generateUID';

import notificationIcon from '../../../assets/notification.png';
import { isConversationMode } from '../../../helpers/mailSettings';
import { setParamsInLocation } from '../../../helpers/mailboxUrl';

interface NotificationParams {
    message: Message;
    history: History<unknown>;
    mailSettings: MailSettings;
    notifier: string[];
    isCategoryViewEnabled: boolean;
    disabledCategoriesIDs: CategoryLabelID[];
}

const getNotificationBodyAndTitle = (message: Message) => {
    const sender = message.Sender.Name || message.Sender.Address;
    return {
        title: c('Desktop notification title').t`New email received`,
        body: c('Desktop notification body').t`From: ${sender} - ${message.Subject}`,
    };
};

const getElementIDAndMessageID = (
    notificationLabel: string,
    mailSettings: MailSettings,
    locationWithNoHash: Location,
    message: Message
) => {
    const conversationMode = isConversationMode(notificationLabel, mailSettings, locationWithNoHash);
    return {
        elementID: conversationMode ? message.ConversationID : message.ID,
        messageID: conversationMode ? message.ID : undefined,
    };
};

/**
 * The notification label is the labelID present in both the notifier and LabelIDs of the message.
 * When the labelID is inbox and category view is enabled, the category label is used instead.
 */
const getNotificationLabel = (message: Message, notifier: string[], isCategoryViewEnabled: boolean) => {
    const labelID = message.LabelIDs.find((labelID) => notifier.includes(labelID)) || MAILBOX_LABEL_IDS.ALL_MAIL;

    if (labelID === MAILBOX_LABEL_IDS.INBOX && isCategoryViewEnabled) {
        const categoryLabel = message.LabelIDs.find(isCategoryLabel);
        // Falling back to All mail prevents showing a notification that would redirect users to Inbox and break the UI
        return categoryLabel && notifier.includes(categoryLabel) ? categoryLabel : MAILBOX_LABEL_IDS.ALL_MAIL;
    }

    // Reachable when the notifier still holds category labels from a time where category view was enabled.
    // Categories are disabled now, so we redirect to Inbox instead.
    if (isCategoryLabel(labelID) && !isCategoryViewEnabled) {
        return MAILBOX_LABEL_IDS.INBOX;
    }

    return labelID;
};

/**
 * Category labels are not routable on their own: we redirect to Inbox and select the
 * category through the URL hash. Disabled categories fall back to the default one.
 */
const getRoute = (location: Location, notificationLabel: string, disabledCategoriesIDs: CategoryLabelID[]) => {
    if (!isCategoryLabel(notificationLabel)) {
        return { location, labelID: notificationLabel };
    }

    const categoryLabel = disabledCategoriesIDs.includes(notificationLabel)
        ? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT
        : notificationLabel;

    return {
        location: { ...location, hash: `#category=${LABEL_IDS_TO_HUMAN[categoryLabel]}` },
        labelID: MAILBOX_LABEL_IDS.INBOX,
    };
};

export const prepareNotificationData = ({
    message,
    history,
    mailSettings,
    notifier,
    isCategoryViewEnabled,
    disabledCategoriesIDs,
}: NotificationParams) => {
    // Remove the search keyword from the URL to find the message or conversation. Otherwise we can have a 'Conversation does not exists' error.
    const locationWithNoHash: Location = { ...history.location, hash: '' };
    const notificationLabel = getNotificationLabel(message, notifier, isCategoryViewEnabled);

    const { location: routeLocation, labelID } = getRoute(locationWithNoHash, notificationLabel, disabledCategoriesIDs);

    const { elementID, messageID } = getElementIDAndMessageID(
        notificationLabel,
        mailSettings,
        locationWithNoHash,
        message
    );

    const location = setParamsInLocation(routeLocation, { labelID, elementID, messageID });
    const { title, body } = getNotificationBodyAndTitle(message);
    return { title, body, location, ID: message.ID, labelID, elementID, messageID };
};

export const displayNotification = ({
    onOpenElement,
    ...params
}: NotificationParams & { onOpenElement: () => void }) => {
    const notificationData = prepareNotificationData(params);

    if (isElectronMail) {
        return createElectronNotification({ app: 'mail', ...notificationData });
    }

    return create(notificationData.title, {
        tag: notificationData.ID,
        body: notificationData.body,
        icon: notificationIcon,
        onClick() {
            window.focus();
            params.history.push(notificationData.location);
            onOpenElement();
        },
    });
};

export const displayGroupedNotification = ({
    messageCount,
    history,
    onOpenElement,
}: {
    messageCount: number;
    history: History<unknown>;
    onOpenElement: () => void;
}) => {
    const ID = generateUID('grouped-notification');
    const title = c('Desktop notification title').t`New email received`;
    const body = c('Desktop notification body').ngettext(
        msgid`${messageCount} new message`,
        `${messageCount} new messages`,
        messageCount
    );

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
