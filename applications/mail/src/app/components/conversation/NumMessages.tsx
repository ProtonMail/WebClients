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

    return <span className={className}>[{NumMessages}]</span>;
};

export default NumMessages;
