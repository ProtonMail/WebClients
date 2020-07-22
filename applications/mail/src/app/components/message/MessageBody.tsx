import React, { useMemo, useState } from 'react';
import { classnames, Button, EllipsisLoader } from 'react-components';
import { c } from 'ttag';

import { isPlainText } from '../../helpers/message/messages';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';
import { MessageExtended } from '../../models/message';
import { locateBlockquote } from '../../helpers/message/messageBlockquote';

import './MessageBody.scss';

interface Props {
    messageLoaded: boolean;
    bodyLoaded: boolean;
    sourceMode: boolean;
    message: MessageExtended;

    /**
     * Needed for print message
     * true: (default) show button and collapse blockquote (if one founded)
     * false: don't show button, show full content
     */
    showBlockquote?: boolean;
}

const MessageBody = ({
    messageLoaded,
    bodyLoaded,
    sourceMode: inputSourceMode,
    message,
    showBlockquote = true
}: Props) => {
    const plain = isPlainText(message.data);

    const [expanded, setExpanded] = useState(false);

    const [content, blockquote] = useMemo(
        () => (plain ? [message.plainText as string, ''] : locateBlockquote(message.document)),
        [message.document?.innerHTML, message.plainText, plain]
    );

    const encryptedMode = messageLoaded && message.errors?.decryption;
    const sourceMode = !encryptedMode && inputSourceMode;
    const decryptingMode = !encryptedMode && !sourceMode && !bodyLoaded && messageLoaded;
    const loadingMode = !messageLoaded;
    const contentMode = !encryptedMode && !sourceMode && bodyLoaded;
    const isBlockquote = blockquote !== '';
    const showButton = showBlockquote && isBlockquote && !expanded;
    const __html = showBlockquote && !expanded ? content : content + blockquote;

    return (
        <div
            className={classnames([
                'message-content scroll-horizontal-if-needed relative bodyDecrypted',
                plain && 'plain',
                !loadingMode && getLightOrDark('', 'bg-white color-global-grey')
            ])}
        >
            {encryptedMode && <pre>{message.data?.Body}</pre>}
            {sourceMode && <pre>{message.decryptedBody}</pre>}
            {loadingMode && <div className="message-content-loading-placeholder"></div>}
            {decryptingMode && (
                <div>
                    {c('Message').t`Decrypting content`}
                    <EllipsisLoader />
                </div>
            )}
            {contentMode && (
                <>
                    <div dangerouslySetInnerHTML={{ __html }} />
                    {showButton && (
                        <Button className="pm-button--small m0-5" onClick={() => setExpanded(true)}>
                            ...
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

export default MessageBody;
