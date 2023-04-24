import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Icon } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isAutoReply } from '@proton/shared/lib/mail/messages';

import { MessageWithOptionalBody } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageWithOptionalBody;
}

const ExtraAutoReply = ({ message }: Props) => {
    if (!isAutoReply(message)) {
        return null;
    }

    return (
        <div
            className="bg-norm rounded border pl0-5 pr0-25 on-mobile-pr0-5 on-mobile-pb0-5 py0-25 mb-3 flex flex-nowrap"
            data-testid="auto-reply-banner"
        >
            <Icon name="robot" className="flex-item-noshrink ml-1 mt-1" />
            <span className="pl0-5 pr0-5 mt-1 pb0-25 flex-item-fluid">
                {c('Info').t`This message is automatically generated as a response to a previous message.`}{' '}
                <Href href={getKnowledgeBaseUrl('/auto-reply')}>{c('Info').t`Learn more`}</Href>
            </span>
        </div>
    );
};

export default ExtraAutoReply;
