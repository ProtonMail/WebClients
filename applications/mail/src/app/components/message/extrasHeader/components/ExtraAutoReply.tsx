import { c } from 'ttag';

import { Banner, Href } from '@proton/atoms';
import { Icon } from '@proton/components';
import type { MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isAutoReply } from '@proton/shared/lib/mail/messages';

interface Props {
    message: MessageWithOptionalBody;
}

const ExtraAutoReply = ({ message }: Props) => {
    if (!isAutoReply(message)) {
        return null;
    }

    return (
        <Banner
            data-testid="auto-reply-banner"
            variant="norm-outline"
            link={
                <Href href={getKnowledgeBaseUrl('/auto-reply')} className="inline-block">{c('Info')
                    .t`Learn more`}</Href>
            }
            icon={<Icon name="robot" />}
        >
            {c('Info').t`This message is automatically generated as a response to a previous message.`}
        </Banner>
    );
};

export default ExtraAutoReply;
