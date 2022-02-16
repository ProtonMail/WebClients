import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    const [isIframeContentSet, setIsIframeContentSet] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);
    const [theme] = useTheme();
    const isDarkTheme = DARK_THEMES.includes(theme);
    const { highlightString, getESDBStatus } = useEncryptedSearchContext();
    const onMailTo = useOnMailTo();
    const [mailSettings] = useMailSettings();
    const { dbExists, esEnabled } = getESDBStatus();
    const highlightBody = highlightKeywords && dbExists && esEnabled;
    const plain = isPlainText(message.data);
    const hasDarkStyles = useMessageDarkStyles(message);
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
            setIsIframeContentSet(true);
            if (!!content && highlightBody) {
                const el = iframeRootElement.querySelector('[data-auto-scroll]') as HTMLElement;
                scrollIntoView(el, { block: 'center', behavior: 'smooth' });
            }
        },
        [content, highlightBody]
    );

    useEffect(() => {
        if (encryptedMode) {
            setIsIframeContentSet(true);
        }
    }, [encryptedMode]);

    return (
        <div
            ref={bodyRef}
            className={classnames([
                'message-content relative bg-norm color-norm',
                plain && 'plain',
                isPrint ? '' : 'p1',
                !hasDarkStyles && isDarkTheme && !plain && !sourceMode && 'dark-style', // Required for the iframe margin reserved for the horizontal scroll
            ])}
            data-testid="message-content:body"
        >
            {encryptedMode && <pre className="m0">{message.data?.Body}</pre>}
            {sourceMode && <pre className="m0">{message.decryption?.decryptedBody}</pre>}
            {(loadingMode || decryptingMode || !isIframeContentSet) && (
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
                <div className={classnames(['message-iframe', !isIframeContentSet && 'message-iframe--hidden'])}>
                    <MessageBodyIframe
                        content={highlightedContent}
                        blockquoteContent={highlightedBlockquote}
                        showBlockquoteToggle={showButton}
                        showBlockquote={showBlockquote}
                        onBlockquoteToggle={toggleOriginalMessage}
                        onContentLoaded={onContentLoadedCallback}
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
