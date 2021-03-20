import React from 'react';
import { Icon, Href } from 'react-components';
import { c } from 'ttag';
import { isAutoReply } from 'proton-shared/lib/mail/messages';

import { MessageExtended } from '../../../models/message';

interface Props {
    message: MessageExtended;
}

const ExtraAutoReply = ({ message }: Props) => {
    if (!isAutoReply(message.data)) {
        return null;
    }

    return (
        <div className="bg-norm rounded bordered p0-5 mb0-5 flex flex-nowrap">
            <Icon name="auto-reply" className="flex-item-noshrink mtauto mbauto" />
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
