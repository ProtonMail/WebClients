import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import { useConversationCounts, useMessageCounts } from '@proton/mail';

interface MailboxListScreenReaderHeadingProps {
    conversationMode: boolean;
    labelID?: string;
}

const MailboxListScreenReaderHeading = ({ conversationMode, labelID }: MailboxListScreenReaderHeadingProps) => {
    const [conversationCounts] = useConversationCounts();
    const [messageCounts] = useMessageCounts();

    const unreads = useMemo(() => {
        const counters = conversationMode ? conversationCounts : messageCounts;
        return (counters || []).find((counter) => counter.LabelID === labelID)?.Unread || 0;
    }, [conversationMode, labelID, conversationCounts, messageCounts]);

    return (
        <h1 className="sr-only">
            {conversationMode ? c('Title').t`Conversation list` : c('Title').t`Message list`}{' '}
            {c('Title').ngettext(msgid`${unreads} unread message`, `${unreads} unread messages`, unreads)}
        </h1>
    );
};

export default MailboxListScreenReaderHeading;
