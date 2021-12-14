import { RefObject, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { c } from 'ttag';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import { classnames, Tooltip } from '@proton/components';

import { MailSettings } from '@proton/shared/lib/interfaces';
import { useMailboxContainerContext } from '../../containers/mailbox/MailboxContainerProvider';
import useObserveWidthChange from '../../hooks/message/useObserveWidthChange';
import { MessageState } from '../../logic/messages/messagesTypes';
import useInitIframeContent from './hooks/useInitIframeContent';
import useIframeDispatchEvents from './hooks/useIframeDispatchEvents';

import { locateHead } from '../../helpers/message/messageHead';
import useSetIframeHeight from './hooks/useSetIframeHeight';
import useIframeShowBlockquote from './hooks/useIframeShowBlockquote';
import { MESSAGE_IFRAME_PRINT_ID } from './constants';
import MessagePrintHeader from './MessagePrintHeader';
import MessageBodyImages from './MessageBodyImages';
import useIframeOffset from './hooks/useIframeOffset';

interface Props {
    content: string;
    showBlockquote: boolean;
    showBlockquoteToggle: boolean;
    blockquoteContent: string;
    isPlainText: boolean;
    wrapperRef: RefObject<HTMLDivElement>;
    onBlockquoteToggle?: () => void;
    onContentLoaded: (iframeRootElement: HTMLDivElement) => void;
    isPrint?: boolean;
    message: MessageState;
    labelID: string;
    onReady?: (iframeRef: RefObject<HTMLIFrameElement>) => void;
    mailSettings: [MailSettings | undefined, boolean, any];
    onMailTo?: (src: string) => void;
}

const MessageBodyIframe = ({
    content,
    wrapperRef,
    blockquoteContent,
    showBlockquote: showBlockquoteProp,
    showBlockquoteToggle,
    onBlockquoteToggle,
    onContentLoaded,
    isPlainText,
    isPrint = false,
    message,
    labelID,
    onReady,
    mailSettings,
    onMailTo,
}: Props) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const messageHead = locateHead(message.messageDocument?.document);

    const { isResizing } = useMailboxContainerContext();

    const setIframeHeight = useSetIframeHeight(iframeRef);
    const { initStatus, iframeRootDivRef } = useInitIframeContent({
        content,
        messageHead,
        iframeRef,
        setIframeHeight,
        onContentLoaded,
        isPlainText,
        onReady,
    });
    const { showToggle, iframeToggleDiv, showBlockquote, setShowBlockquote } = useIframeShowBlockquote({
        blockquoteContent,
        iframeRef,
        initStatus,
        setIframeHeight,
        showBlockquoteProp,
        showBlockquoteToggle,
        onBlockquoteToggle,
    });
    const iframeOffset = useIframeOffset(iframeRef);

    useLinkHandler(iframeRootDivRef, {
        onMailTo,
        startListening: initStatus === 'done' && iframeRootDivRef.current !== undefined,
        mailSettings,
    });

    const onImagesLoadedCallback = useCallback(() => {
        setIframeHeight();
    }, [setIframeHeight]);

    useObserveWidthChange(wrapperRef, setIframeHeight);
    useIframeDispatchEvents(initStatus, iframeRef);

    useEffect(() => {
        if (message.messageImages?.showRemoteImages || message.messageImages?.showEmbeddedImages) {
            setIframeHeight();
        }
    }, [message.messageImages?.showRemoteImages, message.messageImages?.showEmbeddedImages]);

    const iframePrintDiv = iframeRef.current?.contentDocument?.getElementById(MESSAGE_IFRAME_PRINT_ID);

    return (
        <>
            <iframe
                title={c('Title').t`Email content`}
                src="about:blank"
                scrolling="yes"
                frameBorder="0"
                ref={iframeRef}
                className={classnames([initStatus !== 'start' ? 'w100' : 'w0 h0', isResizing && 'no-pointer-events'])}
                data-testid="content-iframe"
                data-subject={message.data?.Subject}
                // Had to allow scripts in order to allow react portals to execute in Safari
                sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-scripts"
                allowFullScreen={false}
            />
            {initStatus !== 'start' && (
                <MessageBodyImages
                    iframeOffset={iframeOffset}
                    iframeRef={iframeRef}
                    isPrint={isPrint}
                    messageImages={message.messageImages}
                    onImagesLoaded={onImagesLoadedCallback}
                />
            )}
            {showToggle &&
                iframeToggleDiv &&
                createPortal(
                    <Tooltip
                        title={showBlockquote ? c('Info').t`Hide original message` : c('Info').t`Show original message`}
                        anchorOffset={iframeOffset}
                    >
                        <button
                            type="button"
                            className="proton-toggle-button"
                            onClick={() => {
                                setShowBlockquote(!showBlockquote);
                            }}
                            data-testid="message-view:expand-codeblock"
                        >
                            ...
                        </button>
                    </Tooltip>,
                    iframeToggleDiv
                )}
            {isPrint &&
                iframePrintDiv &&
                createPortal(<MessagePrintHeader message={message} labelID={labelID} />, iframePrintDiv)}
        </>
    );
};

export default MessageBodyIframe;
