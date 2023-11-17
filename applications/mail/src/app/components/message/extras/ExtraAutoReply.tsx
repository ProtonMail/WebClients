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
            className="bg-norm rounded border pr-2 md:pr-1 pb-2 md:pb-1 pt-1 pl-2 mb-3 flex flex-nowrap"
            data-testid="auto-reply-banner"
        >
            <Icon name="robot" className="flex-item-noshrink ml-1 mt-1" />
            <span className="px-2 mt-1 pb-1 flex-1">
                {c('Info').t`This message is automatically generated as a response to a previous message.`}{' '}
                <Href href={getKnowledgeBaseUrl('/auto-reply')}>{c('Info').t`Learn more`}</Href>
            </span>
        </div>
    );
};

export default ExtraAutoReply;
