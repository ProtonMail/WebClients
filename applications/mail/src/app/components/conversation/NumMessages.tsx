import { c, msgid } from 'ttag';

import { Conversation } from '../../models/conversation';

import './NumMessages.scss';

interface Props {
    conversation: Conversation | undefined;
    className?: string;
}

const NumMessages = ({ conversation, className }: Props) => {
    // ContextNumMessages should not be used
    const { NumMessages = 0 } = conversation || {};

    if (NumMessages <= 1) {
        return null;
    }

    return (
        <>
            <span className={className} aria-hidden="true">
                [{NumMessages}]
            </span>
            <span className="sr-only">
                {c('Info').ngettext(
                    msgid`${NumMessages} message in conversation`,
                    `${NumMessages} messages in conversation`,
                    NumMessages
                )}
            </span>
        </>
    );
};

export default NumMessages;
