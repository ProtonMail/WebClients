import { Icon, Href } from '@proton/components';
import { c } from 'ttag';
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
        <div className="bg-norm rounded border p0-5 mb0-5 flex flex-nowrap">
            <Icon name="robot" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{c('Info')
                .t`This message is automatically generated as a response to a previous message.`}</span>
            <span className="flex-item-noshrink flex">
                <Href className="text-underline" href="https://protonmail.com/support/knowledge-base/autoresponder/">
                    {c('Info').t`Learn more`}
                </Href>
            </span>
        </div>
    );
};

export default ExtraAutoReply;
