import React, { useMemo } from 'react';
import { classnames, useToggle, Button } from 'react-components';

import { isPlainText } from '../../helpers/message/messages';
import { MessageExtended } from '../../models/message';
import { locateBlockquote } from '../../helpers/message/messageBlockquote';

import './MessageBody.scss';

interface Props {
    message: MessageExtended;
}

const MessageBody = ({ message: { document, data: message = {} } }: Props) => {
    const { state: expand, toggle } = useToggle();

    const plain = isPlainText(message);

    const [content, blockquote] = useMemo(() => locateBlockquote(document), [document?.innerHTML]);

    return (
        <div className={classnames(['message-content bodyDecrypted', plain && 'plain'])}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
            {blockquote !== '' && (
                <>
                    <Button className="pm-button--small m0-5" onClick={toggle}>
                        ...
                    </Button>
                    {expand && <div dangerouslySetInnerHTML={{ __html: blockquote }} />}
                </>
            )}
        </div>
    );
};

export default MessageBody;
