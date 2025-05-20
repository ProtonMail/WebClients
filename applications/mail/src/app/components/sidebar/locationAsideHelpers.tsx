import { c, msgid } from 'ttag';

import type { MailSettings } from '@proton/shared/lib/interfaces';
import { CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { getNUnreadConversationsText, getNUnreadMessagesText } from 'proton-mail/helpers/text';

const UNREAD_LIMIT = 9999;
const MAIL_SUBSCRIPTION_LIMIT = 999;

export const getUnreadTitle = (
    shouldDisplayTotal: boolean,
    unreadCount: number,
    mailSettings: MailSettings,
    labelID: string
) => {
    if (shouldDisplayTotal) {
        return c('Info').ngettext(
            msgid`${unreadCount} scheduled message`,
            `${unreadCount} scheduled messages`,
            unreadCount
        );
    }

    if (labelID === CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS) {
        return c('Info').ngettext(
            msgid`${unreadCount} newsletter subscription`,
            `${unreadCount} newsletter subscriptions`,
            unreadCount
        );
    }

    if (mailSettings.ViewMode === VIEW_MODE.GROUP) {
        return getNUnreadConversationsText(unreadCount);
    }
    return getNUnreadMessagesText(unreadCount);
};

export const getUnreadCount = (labelID: string, unreadCount: number) => {
    if (labelID === CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS) {
        return unreadCount > MAIL_SUBSCRIPTION_LIMIT ? '999+' : unreadCount;
    }

    return unreadCount > UNREAD_LIMIT ? '9999+' : unreadCount;
};
