import { Button, classnames, Tooltip } from '@proton/components';
import MessageBodyImage from 'proton-mail/src/app/components/message/MessageBodyImage';
import { MessageState } from 'proton-mail/src/app/logic/messages/messagesTypes';
import { useEffect, useMemo, useRef, useState } from 'react';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import { locateBlockquote } from 'proton-mail/src/app/helpers/message/messageBlockquote';
import { c } from 'ttag';
import '../../../../../mail/src/app/components/message/MessageBody.scss';

interface Props {
    message: MessageState;
    messageLoaded: boolean;
    bodyLoaded: boolean;
    sourceMode: boolean;
    originalMessageMode: boolean;
    toggleOriginalMessage?: () => void;
}

const EOMessageBody = ({ message, messageLoaded, bodyLoaded, sourceMode: inputSourceMode, originalMessageMode, toggleOriginalMessage }: Props) => {
    const bodyRef = useRef<HTMLDivElement>(null);
    const plain = isPlainText(message.data);

    const [content, blockquote] = useMemo(
        () =>
            plain
                ? [message.messageDocument?.plainText as string, '']
                : locateBlockquote(message.messageDocument?.document),
        [message.messageDocument?.document?.innerHTML, message.messageDocument?.plainText, plain]
    );

    const [, forceRefresh] = useState({});

    const encryptedMode = messageLoaded && !!message.errors?.decryption?.length;
    const sourceMode = !encryptedMode && inputSourceMode;
    const decryptingMode = !encryptedMode && !sourceMode && !bodyLoaded && messageLoaded;
    const loadingMode = !messageLoaded;
    const contentMode = !encryptedMode && !sourceMode && bodyLoaded;
    const isBlockquote = blockquote !== '';
    const showBlockquote = originalMessageMode;

    useEffect(() => {
        // Images need a second render to find the anchors for the portal
        // This forced refresh create this doubled render when blockquote is toggled
        setTimeout(() => forceRefresh({}));
    }, [showBlockquote]);

    return (
        <div
            ref={bodyRef}
            className={classnames([
                'message-content scroll-horizontal-if-needed relative bodyDecrypted bg-norm color-norm',
                plain && 'plain',
            ])}
            data-testid="message-content:body"
        >
            {encryptedMode && <pre>{message.data?.Body}</pre>}
            {sourceMode && <pre>{message.decryption?.decryptedBody}</pre>}
            {(loadingMode || decryptingMode) && (
                <>
                    <div className="message-content-loading-placeholder mb0-25 max-w8e" />
                    <div className="message-content-loading-placeholder mb0-25 max-w50e" />
                    <div className="message-content-loading-placeholder mb0-25 max-w40e" />
                    <div className="message-content-loading-placeholder mb0-25 max-w50e" />
                    <div className="message-content-loading-placeholder mb0-25 max-w15e" />
                    <div className="message-content-loading-placeholder max-w8e" />
                </>
            )}
            {contentMode && (
                <>
                    {/* eslint-disable-next-line react/no-danger */}
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                    {message.messageImages?.images.map((image) => (
                        <MessageBodyImage
                            key={image.id}
                            bodyRef={bodyRef}
                            showRemoteImages={message.messageImages?.showRemoteImages || false}
                            showEmbeddedImages={message.messageImages?.showEmbeddedImages || false}
                            image={image}
                        />
                    ))}
                    {isBlockquote && (
                        <>
                            {isBlockquote && (
                                <Tooltip
                                    title={
                                        originalMessageMode
                                            ? c('Info').t`Hide original message`
                                            : c('Info').t`Show original message`
                                    }
                                >
                                    <Button
                                        size="small"
                                        shape="outline"
                                        className="m0-5 toggle-original-message-button"
                                        onClick={() => toggleOriginalMessage?.()}
                                        data-testid="message-view:expand-codeblock"
                                    >
                                        ...
                                    </Button>
                                </Tooltip>
                            )}
                            {/* eslint-disable-next-line react/no-danger */}
                            {showBlockquote && <div dangerouslySetInnerHTML={{ __html: blockquote }} />}
                        </>
                    )}
                    </>
            )}
        </div>
    );
};

export default EOMessageBody;
