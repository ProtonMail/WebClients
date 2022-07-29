import { RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { classnames, useMailSettings, useTheme } from '@proton/components';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import { DARK_THEMES } from '@proton/shared/lib/themes/themes';

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
    const [theme] = useTheme();
    const isDarkTheme = DARK_THEMES.includes(theme);
    const { highlightString, shouldHighlight } = useEncryptedSearchContext();
    const onMailTo = useOnMailTo();
    const [mailSettings] = useMailSettings();
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
            className={classnames([
                'message-content relative bg-norm color-norm overflow-hidden',
                plain && 'plain',
                isPrint && 'message-content-print',
                isPrint || !isIframeContentSet ? '' : 'pt1 pb1 px1-25',
                !placeholderMode && !hasDarkStyles && isDarkTheme && !plain && !sourceMode && 'dark-style', // Required for the iframe margin reserved for the horizontal scroll
            ])}
            data-testid="message-content:body"
        >
            {encryptedMode && <pre className="m0 p1">{message.data?.Body}</pre>}
            {sourceMode && <pre className="m0 p1">{message.decryption?.decryptedBody}</pre>}
            {placeholderMode && !encryptedMode && (
                <div className="bg-norm color-norm p1">
                    <div className="message-content-loading-placeholder mx1-25 mb0-25 max-w8e" />
                    <div className="message-content-loading-placeholder mx1-25 mb0-25 max-w50e" />
                    <div className="message-content-loading-placeholder mx1-25 mb0-25 max-w40e" />
                    <div className="message-content-loading-placeholder mx1-25 mb0-25 max-w50e" />
                    <div className="message-content-loading-placeholder mx1-25 mb0-25 max-w15e" />
                    <div className="message-content-loading-placeholder mx1-25 mb1 max-w8e" />
                </div>
            )}
            {contentMode && (
                <div
                    className={classnames([
                        'message-iframe',
                        !contentModeShow && 'message-iframe--hidden',
                        !isPrint && isIframeContentSet && 'p1',
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
