import { c, msgid } from 'ttag';

export const getNUnreadConversationsText = (n: number) => {
    return c('Info').ngettext(msgid`${n} unread conversation`, `${n} unread conversations`, n);
};

export const getNUnreadMessagesText = (n: number) => {
    return c('Info').ngettext(msgid`${n} unread conversation`, `${n} unread conversations`, n);
};
