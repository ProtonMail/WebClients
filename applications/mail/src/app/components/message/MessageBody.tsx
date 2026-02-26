import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useTheme } from '@proton/components';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import MessageBodyIframe from '@proton/mail-renderer/components/MessageBodyIframe';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import { isAutoFlaggedPhishing, isPlainText, isSuspicious } from '@proton/shared/lib/mail/messages';
import iframeSVG from '@proton/styles/assets/img/icons/email-sprite-icons.source.svg';
import clsx from '@proton/utils/clsx';

import MessageBodyPlaceholder from 'proton-mail/components/message/MessageBodyPlaceholder';
import MessageBodyPrint from 'proton-mail/components/message/MessageBodyPrint';
import useMessageImagesLoadError from 'proton-mail/components/message/hooks/useMessageImagesLoadError';
import { useMailboxContainerContext } from 'proton-mail/containers/mailbox/MailboxContainerProvider';
import { isMessageContentEmpty } from 'proton-mail/helpers/message/messageContent';

import { useOnMailTo } from '../../containers/ComposeProvider';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { locateBlockquote } from '../../helpers/message/messageBlockquote';

import iframeCSSStyles from '@proton/mail-renderer/helpers/MessageIframe.raw.scss';

interface Props {
    labelID: string;
    messageLoaded: boolean;
    bodyLoaded: boolean;
    sourceMode: boolean;
    message: MessageState;
    originalMessageMode: boolean;
    toggleOriginalMessage?: () => void;
    /**
     * Needed for print message
     * true: don't show button, show full content
     * false: (default) show button and collapse blockquote (if one founded)
     */
    forceBlockquote?: boolean;
    onMessageReady?: () => void;
    isPrint?: boolean;
    onIframeReady?: (iframeRef: RefObject<HTMLIFrameElement>) => void;
    onFocusIframe?: () => void;
}

const MessageBody = ({
    messageLoaded,
    bodyLoaded,
    sourceMode: inputSourceMode,
    message,
    forceBlockquote = false,
    originalMessageMode,
    toggleOriginalMessage,
    onMessageReady,
    isPrint = false,
    labelID,
    onIframeReady,
    onFocusIframe,
}: Props) => {
    const [isIframeContentSet, setIsIframeContentSet] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const iframeRootDivRef = useRef<HTMLDivElement>();
    const theme = useTheme();
    const { highlightString, shouldHighlight } = useEncryptedSearchContext();
    const onMailTo = useOnMailTo();
    const [mailSettings] = useMailSettings();
    const highlightBody = shouldHighlight();
    const plain = isPlainText(message.data);
    const handleMessageImageLoadError = useMessageImagesLoadError({
        localID: message.localID,
        useProxy: !!mailSettings.ImageProxy,
    });
    const [content, blockquote] = useMemo(
        () =>
            plain
                ? [message.messageDocument?.plainText as string, '']
                : locateBlockquote(message.messageDocument?.document),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-6B18F7
        [message.messageDocument?.document?.innerHTML, message.messageDocument?.plainText, plain]
    );

    const isContentEmpty = useMemo(() => isMessageContentEmpty(content, plain), [content, plain]);

    const encryptedMode = messageLoaded && !!message.errors?.decryption?.length;
    const sourceMode = !encryptedMode && inputSourceMode;
    const decryptingMode = !encryptedMode && !sourceMode && !bodyLoaded && messageLoaded;
    const loadingMode = !messageLoaded;
    const contentMode = !encryptedMode && !sourceMode && bodyLoaded;
    const contentModeShow = contentMode && isIframeContentSet;
    const placeholderMode = (loadingMode || decryptingMode || !contentModeShow) && !sourceMode;
    const isBlockquote = blockquote !== '';
    const showButton = !forceBlockquote && isBlockquote && !isContentEmpty;
    const showBlockquote = forceBlockquote || originalMessageMode || isContentEmpty;
    const highlightedContent = useMemo(
        () => (!!content && highlightBody ? highlightString(content, true) : content),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-E4F9FB
        [content, highlightBody]
    );
    const highlightedBlockquote = useMemo(
        () =>
            !!blockquote && highlightBody
                ? highlightString(blockquote, !highlightedContent.includes('data-auto-scroll'))
                : blockquote,
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-9F9647
        [blockquote, highlightBody]
    );
    const showBlockquoteResults = highlightedBlockquote !== blockquote;

    const { modal: linkModal } = useLinkHandler(iframeRootDivRef, mailSettings, {
        onMailTo,
        startListening: isIframeContentSet && iframeRootDivRef.current !== undefined,
        isOutside: false,
        isPhishingAttempt: isAutoFlaggedPhishing(message.data) || isSuspicious(message.data),
    });
    const { isResizing } = useMailboxContainerContext();

    useEffect(() => {
        if (!loadingMode && !decryptingMode && onMessageReady) {
            setTimeout(onMessageReady);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-16DDBD
    }, [loadingMode, decryptingMode, message.data?.ID]);

    const handleContentLoaded = (iframeRootDivElement: HTMLDivElement) => {
        setIsIframeContentSet(true);
        iframeRootDivRef.current = iframeRootDivElement;
    };

    useEffect(() => {
        if (contentModeShow && !!content && highlightBody) {
            const el = iframeRef.current?.contentDocument?.querySelector('[data-auto-scroll]') as HTMLElement;
            scrollIntoView(el, { block: 'center', behavior: 'smooth' });
        }
    }, [contentModeShow, content, highlightBody]);

    return (
        <div
            ref={bodyRef}
            className={clsx([
                'message-content relative bg-norm color-norm overflow-hidden',
                plain && 'plain',
                isPrint && 'message-content-print',
                isPrint || !isIframeContentSet ? '' : 'p-0 md:py-4 px-5',
                !placeholderMode && theme.information.dark && !plain && !sourceMode && 'dark-style', // Required for the iframe margin reserved for the horizontal scroll
            ])}
            data-testid="message-content:body"
        >
            {encryptedMode && <pre className="m-0 p-4">{message.data?.Body}</pre>}
            {sourceMode && <pre className="m-0 p-4">{message.decryption?.decryptedBody}</pre>}
            {placeholderMode && !encryptedMode && <MessageBodyPlaceholder margin="normal" />}
            {contentMode && (
                <div
                    className={clsx([
                        'message-iframe',
                        !contentModeShow && 'message-iframe--hidden',
                        !isPrint && isIframeContentSet && 'p-0',
                    ])}
                >
                    <MessageBodyIframe
                        iframeRef={iframeRef}
                        content={highlightedContent}
                        blockquoteContent={highlightedBlockquote}
                        showBlockquoteToggle={showButton}
                        showBlockquote={showBlockquote || showBlockquoteResults}
                        onBlockquoteToggle={toggleOriginalMessage}
                        onContentLoaded={handleContentLoaded}
                        isPlainText={plain}
                        isPrint={isPrint}
                        className={isResizing ? 'pointer-events-none' : undefined}
                        message={message}
                        onReady={onIframeReady}
                        onFocus={onFocusIframe}
                        onMessageImageLoadError={handleMessageImageLoadError}
                        theme={theme}
                        iframeCSSStyles={iframeCSSStyles}
                        iframeSVG={iframeSVG}
                    />
                    <MessageBodyPrint isPrint={isPrint} iframeRef={iframeRef} message={message} labelID={labelID} />
                    {linkModal}
                </div>
            )}
        </div>
    );
};

export default MessageBody;
