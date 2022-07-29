import { useMemo, useRef } from 'react';

import { classnames } from '@proton/components';
import { eoDefaultMailSettings } from '@proton/shared/lib/mail/eo/constants';
import { isPlainText } from '@proton/shared/lib/mail/messages';

import { MailboxContainerContextProvider } from '../../../containers/mailbox/MailboxContainerProvider';
import { locateBlockquote } from '../../../helpers/message/messageBlockquote';
import { MessageState } from '../../../logic/messages/messagesTypes';
import MessageBodyIframe from '../../message/MessageBodyIframe';

interface Props {
    message: MessageState;
    messageLoaded: boolean;
    bodyLoaded: boolean;
    sourceMode: boolean;
}

const EOMessageBody = ({ message, messageLoaded, bodyLoaded, sourceMode: inputSourceMode }: Props) => {
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
            className={classnames([
                'message-content scroll-horizontal-if-needed relative bodyDecrypted bg-norm color-norm px2 py1 on-tiny-mobile-pl0 on-tiny-mobile-pr0',
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
                        iframeRef={iframeRef}
                        content={content}
                        blockquoteContent={blockquote}
                        showBlockquote={false}
                        showBlockquoteToggle={isBlockquote}
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
