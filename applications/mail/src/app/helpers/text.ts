import { c, msgid } from 'ttag';

export const getNUnreadConversationsText = (n: number) => {
    return c('Info').ngettext(msgid`${n} unread conversation`, `${n} unread conversations`, n);
};

export const getNUnreadMessagesText = (n: number) => {
    return c('Info').ngettext(msgid`${n} unread conversation`, `${n} unread conversations`, n);
};

export const getUnreadNewslettersText = (unreadCount?: number) => {
    if (!unreadCount) {
        return c('Info').t`newsletter`;
    }

    // Fix for ttag and multiple string with different variables
    return c('Info').ngettext(msgid`${unreadCount} newsletter`, `${unreadCount} newsletters`, unreadCount);
};
