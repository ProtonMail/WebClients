import React, { useMemo, useState } from 'react';
import { classnames, Button } from 'react-components';

import { isPlainText } from '../../helpers/message/messages';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import { MessageExtended } from '../../models/message';
import { locateBlockquote } from '../../helpers/message/messageBlockquote';

import './MessageBody.scss';

interface Props {
    message: MessageExtended;

    /**
     * Needed for print message
     * true: (default) show button and collapse blockquote (if one founded)
     * false: don't show button, show full content
     */
    showBlockquote?: boolean;
}

const MessageBody = ({ message: { document, plainText, data: message }, showBlockquote = true }: Props) => {
    const [expanded, setExpanded] = useState(false);

    const plain = isPlainText(message);

    const [content, blockquote] = useMemo(() => (plain ? [plainText as string, ''] : locateBlockquote(document)), [
        document?.innerHTML,
        plain
    ]);

    const isBlockquote = blockquote !== '';
    const showButton = showBlockquote && isBlockquote && !expanded;
    const __html = showBlockquote && !expanded ? content : content + blockquote;

    return (
        <div
            className={classnames([
                'message-content scroll-horizontal-if-needed relative bodyDecrypted',
                plain && 'plain',
                getLightOrDark('', 'bg-white color-global-grey')
            ])}
        >
            <div dangerouslySetInnerHTML={{ __html }} />
            {showButton && (
                <Button className="pm-button--small m0-5" onClick={() => setExpanded(true)}>
                    ...
                </Button>
            )}
        </div>
    );
};

export default MessageBody;
