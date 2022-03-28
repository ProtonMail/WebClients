import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { isPlainText } from '@proton/shared/lib/mail/messages';
import { scrollIntoView } from '@proton/shared/lib/helpers/dom';
import { DARK_THEMES } from '@proton/shared/lib/themes/themes';
import { classnames, useMailSettings, useTheme } from '@proton/components';

import { locateBlockquote } from '../../helpers/message/messageBlockquote';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { MessageState } from '../../logic/messages/messagesTypes';
import MessageBodyIframe from './MessageBodyIframe';
import useMessageDarkStyles from './hooks/useMessageDarkStyles';
import { useOnMailTo } from '../../containers/ComposeProvider';

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
}: Props) => {
    const [isIframeContentSet, setIsIframeContentSet] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [theme] = useTheme();
    const isDarkTheme = DARK_THEMES.includes(theme);
    const { highlightString, getESDBStatus, shouldHighlight } = useEncryptedSearchContext();
    const onMailTo = useOnMailTo();
    const [mailSettings] = useMailSettings();
    const { dbExists, esEnabled } = getESDBStatus();
    const highlightBody = shouldHighlight() && dbExists && esEnabled;
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

    const handleContentLoaded = () => {
        setIsIframeContentSet(true);
    };

    useEffect(() => {
        if (contentModeShow && !!content && highlightBody) {
            const el = iframeRef.current?.querySelector('[data-auto-scroll]') as HTMLElement;
            scrollIntoView(el, { block: 'center', behavior: 'smooth' });
        }
    }, [contentModeShow, content, highlightBody]);

    return (
        <div
            ref={bodyRef}
            className={classnames([
                'message-content relative bg-norm color-norm',
                plain && 'plain',
                isPrint || !isIframeContentSet ? '' : 'pt1 pb1 px1-25',
                !placeholderMode && !hasDarkStyles && isDarkTheme && !plain && !sourceMode && 'dark-style', // Required for the iframe margin reserved for the horizontal scroll
            ])}
            data-testid="message-content:body"
        >
            {encryptedMode && <pre className="m0 p1">{message.data?.Body}</pre>}
            {sourceMode && <pre className="m0 p1">{message.decryption?.decryptedBody}</pre>}
            {placeholderMode && (
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
                        showBlockquote={showBlockquote}
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
                    />
                </div>
            )}
        </div>
    );
};

export default MessageBody;
