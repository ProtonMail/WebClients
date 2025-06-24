import { useMemo, useRef, useState } from 'react';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import MessageBodyIframe from '@proton/mail-renderer/components/MessageBodyIframe';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { EO_DEFAULT_MAILSETTINGS } from '@proton/shared/lib/mail/eo/constants';
import { isAutoFlaggedPhishing, isPlainText, isSuspicious } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import MessageBodyPlaceholder from 'proton-mail/components/message/MessageBodyPlaceholder';
import MessageBodyPrint from 'proton-mail/components/message/MessageBodyPrint';
import useMessageImagesLoadError from 'proton-mail/components/message/hooks/useMessageImagesLoadError';

import { MailboxContainerContextProvider } from '../../../containers/mailbox/MailboxContainerProvider';
import { locateBlockquote } from '../../../helpers/message/messageBlockquote';

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
    const theme = useTheme();
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

    const handleMessageImageLoadError = useMessageImagesLoadError({
        localID: message.localID,
        useProxy: !!EO_DEFAULT_MAILSETTINGS.ImageProxy,
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
                        onMessageImageLoadError={handleMessageImageLoadError}
                        theme={theme}
                    />
                    {linkModal}
                    <MessageBodyPrint isPrint={false} iframeRef={iframeRef} message={message} labelID="" />
                </MailboxContainerContextProvider>
            )}
        </div>
    );
};

export default EOMessageBody;
