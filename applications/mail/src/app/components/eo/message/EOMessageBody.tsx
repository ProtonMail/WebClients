import { useMemo, useRef, useState } from 'react';

import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import { EO_DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/eo/constants';
import { isAutoFlaggedPhishing, isPlainText, isSuspicious } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import MessageBodyPlaceholder from 'proton-mail/components/message/MessageBodyPlaceholder';
import MessageBodyPrint from 'proton-mail/components/message/MessageBodyPrint';

import { MailboxContainerContextProvider } from '../../../containers/mailbox/MailboxContainerProvider';
import { locateBlockquote } from '../../../helpers/message/messageBlockquote';
import type { MessageState } from '../../../store/messages/messagesTypes';
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
    const [isIframeContentSet, setIsIframeContentSet] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const iframeRootDivRef = useRef<HTMLDivElement>();

    const plain = isPlainText(message.data);

    const [content, blockquote] = useMemo(
        () =>
            plain
                ? [message.messageDocument?.plainText as string, '']
                : locateBlockquote(message.messageDocument?.document),
        [message.messageDocument?.document?.innerHTML, message.messageDocument?.plainText, plain]
    );

    const { modal: linkModal } = useLinkHandler(iframeRootDivRef, EO_DEFAULT_MAILSETTINGS, {
        onMailTo: noop,
        startListening: isIframeContentSet && iframeRootDivRef.current !== undefined,
        isOutside: false,
        isPhishingAttempt: isAutoFlaggedPhishing(message.data) || isSuspicious(message.data),
    });

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
                'message-content overflow-x-auto relative bodyDecrypted bg-norm color-norm px-7 py-1',
                plain && 'plain',
            ])}
            data-testid="message-content:body"
        >
            {encryptedMode && <pre>{message.data?.Body}</pre>}
            {sourceMode && <pre>{message.decryption?.decryptedBody}</pre>}
            {(loadingMode || decryptingMode) && <MessageBodyPlaceholder margin="small" />}
            {contentMode && (
                <MailboxContainerContextProvider containerRef={null} elementID={undefined} isResizing={false}>
                    <MessageBodyIframe
                        iframeRef={iframeRef}
                        content={content}
                        blockquoteContent={blockquote}
                        showBlockquote={originalMessageMode}
                        showBlockquoteToggle={isBlockquote}
                        onBlockquoteToggle={onBlockquoteToggle}
                        onContentLoaded={(iframeRootDiv) => {
                            setIsIframeContentSet(true);
                            iframeRootDivRef.current = iframeRootDiv;
                        }}
                        isPlainText={plain}
                        message={message}
                        mailSettings={EO_DEFAULT_MAILSETTINGS}
                    />
                    {linkModal}
                    <MessageBodyPrint isPrint={false} iframeRef={iframeRef} message={message} labelID="" />
                </MailboxContainerContextProvider>
            )}
        </div>
    );
};

export default EOMessageBody;
