import { RefObject, useRef } from 'react';
import { createPortal } from 'react-dom';
import { c } from 'ttag';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import { classnames, Tooltip } from '@proton/components';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { useMailboxContainerContext } from '../../containers/mailbox/MailboxContainerProvider';
import { MessageState } from '../../logic/messages/messagesTypes';
import useInitIframeContent from './hooks/useInitIframeContent';
import useIframeDispatchEvents from './hooks/useIframeDispatchEvents';

import { locateHead } from '../../helpers/message/messageHead';
import useIframeShowBlockquote from './hooks/useIframeShowBlockquote';
import { MESSAGE_IFRAME_PRINT_ID } from './constants';
import MessagePrintHeader from './MessagePrintHeader';
import MessageBodyImages from './MessageBodyImages';
import useIframeOffset from './hooks/useIframeOffset';
import useObserveIframeHeight from './hooks/useObserveIframeHeight';

interface Props {
    content: string;
    showBlockquote: boolean;
    showBlockquoteToggle: boolean;
    blockquoteContent: string;
    isPlainText: boolean;
    onBlockquoteToggle?: () => void;
    onContentLoaded: (iframeRootElement: HTMLDivElement) => void;
    isPrint?: boolean;
    message: MessageState;
    labelID: string;
    onReady?: (iframeRef: RefObject<HTMLIFrameElement>) => void;
    onMailTo?: (src: string) => void;
    isOutside?: boolean;
    mailSettings?: MailSettings;
}

const MessageBodyIframe = ({
    content,
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
    onMailTo,
    isOutside,
    mailSettings,
}: Props) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const messageHead = locateHead(message.messageDocument?.document);

    const { isResizing } = useMailboxContainerContext();

    const { initStatus, iframeRootDivRef } = useInitIframeContent({
        content,
        messageHead,
        iframeRef,
        onContentLoaded,
        isPlainText,
        onReady,
    });
    const { showToggle, iframeToggleDiv, showBlockquote, setShowBlockquote } = useIframeShowBlockquote({
        blockquoteContent,
        iframeRef,
        initStatus,
        showBlockquoteProp,
        showBlockquoteToggle,
        onBlockquoteToggle,
    });
    const iframeOffset = useIframeOffset(iframeRef);

    useLinkHandler(iframeRootDivRef, mailSettings, {
        onMailTo,
        startListening: initStatus === 'done' && iframeRootDivRef.current !== undefined,
        isOutside,
    });

    useIframeDispatchEvents(initStatus, iframeRef);

    useObserveIframeHeight(initStatus === 'done', iframeRef);

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
                /**
                 * "allow-modals" is for printing emails
                 * "allow-scripts" allows react portals to execute in Safari
                 * "allow-popups-to-escape-sandbox" allows to open links in non modal sandboxed mode
                 */
                sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-scripts allow-modals"
                allowFullScreen={false}
            />
            {initStatus !== 'start' && (
                <MessageBodyImages
                    iframeOffset={iframeOffset}
                    iframeRef={iframeRef}
                    isPrint={isPrint}
                    messageImages={message.messageImages}
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
