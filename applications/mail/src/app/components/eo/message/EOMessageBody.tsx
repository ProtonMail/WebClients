import { useMemo, useRef } from 'react';

import { eoDefaultMailSettings } from '@proton/shared/lib/mail/eo/constants';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { MailboxContainerContextProvider } from '../../../containers/mailbox/MailboxContainerProvider';
import { locateBlockquote } from '../../../helpers/message/messageBlockquote';
import { MessageState } from '../../../logic/messages/messagesTypes';
import MessageBodyIframe from '../../message/MessageBodyIframe';

interface Props {
    message: MessageState;
    messageLoaded: boolean;
    bodyLoaded: boolean;
    sourceMode: boolean;
    originalMessageMode: boolean;
    onBlockquoteToggle?: () => void;
}

const EOMessageBody = ({
    message,
    messageLoaded,
    bodyLoaded,
    sourceMode: inputSourceMode,
    originalMessageMode,
    onBlockquoteToggle,
}: Props) => {
    const bodyRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const plain = isPlainText(message.data);

    const [content, blockquote] = useMemo(
        () =>
            plain
                ? [message.messageDocument?.plainText as string, '']
                : locateBlockquote(message.messageDocument?.document),
        [message.messageDocument?.document?.innerHTML, message.messageDocument?.plainText, plain]
    );

    const encryptedMode = messageLoaded && !!message.errors?.decryption?.length;
    const sourceMode = !encryptedMode && inputSourceMode;
    const decryptingMode = !encryptedMode && !sourceMode && !bodyLoaded && messageLoaded;
    const loadingMode = !messageLoaded;
    const contentMode = !encryptedMode && !sourceMode && bodyLoaded;
    const isBlockquote = blockquote !== '';

    return (
        <div
            ref={bodyRef}
            className={clsx([
                'message-content scroll-horizontal-if-needed relative bodyDecrypted bg-norm color-norm px2 py1 on-tiny-mobile-pl0 on-tiny-mobile-pr0',
                plain && 'plain',
            ])}
            data-testid="message-content:body"
        >
            {encryptedMode && <pre>{message.data?.Body}</pre>}
            {sourceMode && <pre>{message.decryption?.decryptedBody}</pre>}
            {(loadingMode || decryptingMode) && (
                <>
                    <div className="message-content-loading-placeholder mb-1 max-w8e" />
                    <div className="message-content-loading-placeholder mb-1 max-w50e" />
                    <div className="message-content-loading-placeholder mb-1 max-w40e" />
                    <div className="message-content-loading-placeholder mb-1 max-w50e" />
                    <div className="message-content-loading-placeholder mb-1 max-w15e" />
                    <div className="message-content-loading-placeholder max-w8e" />
                </>
            )}
            {contentMode && (
                <MailboxContainerContextProvider containerRef={null} elementID={undefined} isResizing={false}>
                    <MessageBodyIframe
                        iframeRef={iframeRef}
                        content={content}
                        blockquoteContent={blockquote}
                        showBlockquote={originalMessageMode}
                        showBlockquoteToggle={isBlockquote}
                        onBlockquoteToggle={onBlockquoteToggle}
                        onContentLoaded={() => {}}
                        isPlainText={plain}
                        message={message}
                        labelID=""
                        isOutside
                        mailSettings={eoDefaultMailSettings}
                    />
                </MailboxContainerContextProvider>
            )}
        </div>
    );
};

export default EOMessageBody;
