import { c } from 'ttag';

import { Href, Icon } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isAutoReply } from '@proton/shared/lib/mail/messages';

import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    message: MessageState;
}

const ExtraAutoReply = ({ message }: Props) => {
    if (!isAutoReply(message.data)) {
        return null;
    }

    return (
        <div className="bg-norm rounded border pl0-5 pr0-25 on-mobile-pr0-5 on-mobile-pb0-5 py0-25 mb0-85 flex flex-nowrap">
            <Icon name="robot" className="flex-item-noshrink ml0-2 mt0-3" />
            <span className="pl0-5 pr0-5 mt0-25 pb0-25 flex-item-fluid">
                {c('Info').t`This message is automatically generated as a response to a previous message.`}{' '}
                <Href href={getKnowledgeBaseUrl('/auto-reply')}>{c('Info').t`Learn more`}</Href>
            </span>
        </div>
    );
};

export default ExtraAutoReply;
