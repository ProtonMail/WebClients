import { RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { useTheme } from '@proton/components';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { useOnMailTo } from '../../containers/ComposeProvider';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { locateBlockquote } from '../../helpers/message/messageBlockquote';
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
    isPrint?: boolean;
    onIframeReady?: (iframeRef: RefObject<HTMLIFrameElement>) => void;
    onFocusIframe?: () => void;
    hasQuickReply?: boolean;
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
    hasQuickReply = false,
}: Props) => {
    const [isIframeContentSet, setIsIframeContentSet] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const theme = useTheme();
    const { highlightString, shouldHighlight } = useEncryptedSearchContext();
    const onMailTo = useOnMailTo();
    const mailSettings = useMailModel('MailSettings');
    const highlightBody = shouldHighlight();
    const plain = isPlainText(message.data);
    const { support: hasDarkStyles, loading: hasDarkStylesLoading } = useMessageDarkStyles(
        message,
        isIframeContentSet,
        iframeRef
    );
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
    const contentModeShow = contentMode && isIframeContentSet && !hasDarkStylesLoading;
    const placeholderMode = (loadingMode || decryptingMode || !contentModeShow) && !sourceMode;
    const isBlockquote = blockquote !== '';
    const showButton = !forceBlockquote && isBlockquote;
    const showBlockquote = forceBlockquote || originalMessageMode || hasDarkStylesLoading;
    const highlightedContent = useMemo(
        () => (!!content && highlightBody ? highlightString(content, true) : content),
        [content, highlightBody]
    );
    const highlightedBlockquote = useMemo(
        () =>
            !!blockquote && highlightBody
                ? highlightString(blockquote, !highlightedContent.includes('data-auto-scroll'))
                : blockquote,
        [blockquote, highlightBody]
    );
    const showBlockquoteResults = highlightedBlockquote !== blockquote;

    useEffect(() => {
        if (!loadingMode && !decryptingMode && onMessageReady) {
            setTimeout(onMessageReady);
        }
    }, [loadingMode, decryptingMode, message.data?.ID]);

    const handleContentLoaded = () => {
        setIsIframeContentSet(true);
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
                isPrint || !isIframeContentSet ? '' : 'py-4 px-5',
                !placeholderMode && !hasDarkStyles && theme.information.dark && !plain && !sourceMode && 'dark-style', // Required for the iframe margin reserved for the horizontal scroll
                hasQuickReply && 'message-content-has-quick-reply',
            ])}
            data-testid="message-content:body"
        >
            {encryptedMode && <pre className="m-0 p-4">{message.data?.Body}</pre>}
            {sourceMode && <pre className="m-0 p-4">{message.decryption?.decryptedBody}</pre>}
            {placeholderMode && !encryptedMode && (
                <div className="bg-norm color-norm p-4">
                    <div
                        className="message-content-loading-placeholder mx-4 mb-4 max-w-custom"
                        style={{ '--max-w-custom': '8em' }}
                    />
                    <div
                        className="message-content-loading-placeholder mx-4 mb-4 max-w-custom"
                        style={{ '--max-w-custom': '50em' }}
                    />
                    <div
                        className="message-content-loading-placeholder mx-4 mb-4 max-w-custom"
                        style={{ '--max-w-custom': '40em' }}
                    />
                    <div
                        className="message-content-loading-placeholder mx-4 mb-4 max-w-custom"
                        style={{ '--max-w-custom': '50em' }}
                    />
                    <div
                        className="message-content-loading-placeholder mx-4 mb-4 max-w-custom"
                        style={{ '--max-w-custom': '15em' }}
                    />
                    <div
                        className="message-content-loading-placeholder mx-4 mb-4 max-w-custom"
                        style={{ '--max-w-custom': '8em' }}
                    />
                </div>
            )}
            {contentMode && (
                <div
                    className={clsx([
                        'message-iframe',
                        !contentModeShow && 'message-iframe--hidden',
                        !isPrint && isIframeContentSet && 'p-4',
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
                        hasDarkStyles={hasDarkStyles}
                        isPrint={isPrint}
                        message={message}
                        labelID={labelID}
                        onReady={onIframeReady}
                        onMailTo={onMailTo}
                        mailSettings={mailSettings}
                        onFocus={onFocusIframe}
                    />
                </div>
            )}
        </div>
    );
};

export default MessageBody;
