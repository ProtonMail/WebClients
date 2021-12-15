import { useEffect, useMemo, useRef, useState } from 'react';
import { classnames } from '@proton/components';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { locateBlockquote } from '../../../helpers/message/messageBlockquote';
import { locateHead } from '../../../helpers/message/messageHead';
import { MailboxContainerContextProvider } from '../../../containers/mailbox/MailboxContainerProvider';
import MessageBodyIframe from '../../message/MessageBodyIframe';

interface Props {
    message: MessageState;
    messageLoaded: boolean;
    bodyLoaded: boolean;
    sourceMode: boolean;
    originalMessageMode: boolean;
    toggleOriginalMessage?: () => void;
}

const EOMessageBody = ({
    message,
    messageLoaded,
    bodyLoaded,
    sourceMode: inputSourceMode,
    originalMessageMode,
    toggleOriginalMessage,
}: Props) => {
    console.log(toggleOriginalMessage);
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

    const messageHead = locateHead(message.messageDocument?.document);

    useEffect(() => {
        // Images need a second render to find the anchors for the portal
        // This forced refresh create this doubled render when blockquote is toggled
        setTimeout(() => forceRefresh({}));
    }, [showBlockquote]);

    return (
        <div
            ref={bodyRef}
            className={classnames([
                'message-content scroll-horizontal-if-needed relative bodyDecrypted bg-norm color-norm p1',
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
                <MailboxContainerContextProvider containerRef={null} elementID={undefined} isResizing={false}>
                    <MessageBodyIframe
                        messageHead={messageHead}
                        content={content}
                        blockquoteContent={blockquote}
                        showBlockquote={showBlockquote}
                        showBlockquoteToggle={isBlockquote}
                        messageImages={message.messageImages}
                        wrapperRef={bodyRef}
                        onContentLoaded={() => {}}
                        isPlainText={plain}
                        message={message}
                        labelID=""
                        messageSubject={message.data?.Subject}
                        mailSettings={[{ ConfirmLink: 1 } as MailSettings, true, {} as Error]}
                        isOutside
                    />
                </MailboxContainerContextProvider>
            )}
        </div>
    );
};

export default EOMessageBody;
