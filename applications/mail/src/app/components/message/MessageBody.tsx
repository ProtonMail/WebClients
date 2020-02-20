import React from 'react';
import { classnames } from 'react-components';

import { isPlainText } from '../../helpers/message/messages';
import { MessageExtended } from '../../models/message';

import './MessageBody.scss';

interface Props {
    message: MessageExtended;
}

const MessageBody = ({ message: { document, data: message = {} } }: Props) => {
    const plain = isPlainText(message);
    return (
        <div
            className={classnames(['message-content bodyDecrypted', plain && 'plain'])}
            dangerouslySetInnerHTML={{ __html: document?.innerHTML || '' }}
        />
    );
};

export default MessageBody;
