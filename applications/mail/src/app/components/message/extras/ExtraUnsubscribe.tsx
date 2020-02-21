import React from 'react';
import { Icon, Href } from 'react-components';
import { c } from 'ttag';
import { getListUnsubscribe } from '../../../helpers/message/messages';
import { MessageExtended } from '../../../models/message';

interface Props {
    message: MessageExtended;
}

const ExtraUnsubscribe = ({ message: { data: message = {} } }: Props) => {
    if (/*unsubscribed || */ !getListUnsubscribe(message)) {
        return null;
    }

    return (
        <div className="bg-white rounded bordered-container p0-5 mb0-5 flex flex-nowrap">
            <Icon name="email" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{c('Info').t`This message is from a mailing list`}</span>
            <span className="flex-item-noshrink flex">
                <Href
                    className="bold mr1 pl0-5 pr0-5"
                    href="https://protonmail.com/support/knowledge-base/auto-unsubscribe"
                >
                    {c('Info').t`Learn more`}
                </Href>
                <a className="bold">{c('Action').t`Unsubscribe`}</a>
            </span>
        </div>
    );
};

export default ExtraUnsubscribe;
