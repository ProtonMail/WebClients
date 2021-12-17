import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';

import { classnames } from '@proton/components';
import { locateBlockquote } from '../../helpers/message/messageBlockquote';
import { locateHead } from '../../helpers/message/messageHead';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { MessageState } from '../../logic/messages/messagesTypes';
import MessageBodyIframe from './MessageBodyIframe';
import useMessageDarkStyles from './hooks/useMessageDarkStyles';

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
    highlightKeywords?: boolean;
    isPrint?: boolean;
    onIframeReady?: (iframeRef: RefObject<HTMLIFrameElement>) => void;
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
    highlightKeywords = false,
    isPrint = false,
    labelID,
    onIframeReady,
}: Props) => {
    const bodyRef = useRef<HTMLDivElement>(null);
    const { highlightString, getESDBStatus } = useEncryptedSearchContext();
    const { dbExists, esEnabled } = getESDBStatus();
    const highlightBody = highlightKeywords && dbExists && esEnabled;
    const plain = isPlainText(message.data);

    const [content, blockquote] = useMemo(
        () =>
            plain
                ? [message.messageDocument?.plainText as string, '']
                : locateBlockquote(message.messageDocument?.document),
        [message.messageDocument?.document?.innerHTML, message.messageDocument?.plainText, plain]
    );
    const messageHead = locateHead(message.messageDocument?.document);

    const encryptedMode = messageLoaded && !!message.errors?.decryption?.length;
    const sourceMode = !encryptedMode && inputSourceMode;
    const decryptingMode = !encryptedMode && !sourceMode && !bodyLoaded && messageLoaded;
    const loadingMode = !messageLoaded;
    const contentMode = !encryptedMode && !sourceMode && bodyLoaded;
    const isBlockquote = blockquote !== '';
    const showButton = !forceBlockquote && isBlockquote;
    const showBlockquote = forceBlockquote || originalMessageMode;
    const highlightedContent = !!content && highlightBody ? highlightString(content, true) : content;
    const highlightedBlockquote =
        !!blockquote && highlightBody
            ? highlightString(blockquote, !highlightedContent.includes('data-auto-scroll'))
            : blockquote;

    useEffect(() => {
        if (!loadingMode && !decryptingMode && onMessageReady) {
            setTimeout(onMessageReady);
        }
    }, [loadingMode, decryptingMode, message.data?.ID]);

    const onContentLoadedCallback = useCallback(
        (iframeRootElement) => {
            if (!!content && highlightBody) {
                const el = iframeRootElement.querySelector('[data-auto-scroll]') as HTMLElement;
                scrollIntoView(el, { block: 'center', behavior: 'smooth' });
            }
        },
        [content, highlightBody]
    );

    const hasDarkStyles = useMessageDarkStyles(message, bodyLoaded, bodyRef);

    return (
        <div
            ref={bodyRef}
            className={classnames([
                'message-content relative bg-norm color-norm',
                plain && 'plain',
                !isPrint && 'p1',
                hasDarkStyles && 'dark-style',
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
                <MessageBodyIframe
                    messageHead={messageHead}
                    content={highlightedContent}
                    blockquoteContent={highlightedBlockquote}
                    showBlockquoteToggle={showButton}
                    showBlockquote={showBlockquote}
                    onBlockquoteToggle={toggleOriginalMessage}
                    messageImages={message.messageImages}
                    wrapperRef={bodyRef}
                    onContentLoaded={onContentLoadedCallback}
                    isPlainText={plain}
                    isPrint={isPrint}
                    message={message}
                    labelID={labelID}
                    onReady={onIframeReady}
                    messageSubject={message.data?.Subject}
                />
            )}
        </div>
    );
};

export default MessageBody;
