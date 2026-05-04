import { c, msgid } from 'ttag';

import { useMailboxCounter } from 'proton-mail/hooks/mailboxCounter/useMailboxCounter';

interface MailboxListScreenReaderHeadingProps {
    conversationMode: boolean;
}

export const MailboxListScreenReaderHeading = ({ conversationMode }: MailboxListScreenReaderHeadingProps) => {
    const { getCurrentLocationCount } = useMailboxCounter();
    const unreads = getCurrentLocationCount().Unread;

    return (
        <h1 className="sr-only">
            {conversationMode ? c('Title').t`Conversation list` : c('Title').t`Message list`}{' '}
            {c('Title').ngettext(msgid`${unreads} unread message`, `${unreads} unread messages`, unreads)}
        </h1>
    );
};
