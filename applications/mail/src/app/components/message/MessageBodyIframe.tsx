import { RefObject, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { c } from 'ttag';
import { hasAttachments } from '@proton/shared/lib/mail/messages';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import { classnames, Tooltip, Icon } from '@proton/components';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { useMailboxContainerContext } from '../../containers/mailbox/MailboxContainerProvider';
import { MessageState } from '../../logic/messages/messagesTypes';
import useInitIframeContent from './hooks/useInitIframeContent';
import useIframeDispatchEvents from './hooks/useIframeDispatchEvents';
import { locateHead } from '../../helpers/message/messageHead';
import useIframeShowBlockquote from './hooks/useIframeShowBlockquote';
import { MESSAGE_IFRAME_PRINT_FOOTER_ID, MESSAGE_IFRAME_PRINT_HEADER_ID } from './constants';
import MessagePrintHeader from './MessagePrintHeader';
import MessageBodyImages from './MessageBodyImages';
import useIframeOffset from './hooks/useIframeOffset';
import useObserveIframeHeight from './hooks/useObserveIframeHeight';
import getIframeSandboxAttributes from './helpers/getIframeSandboxAttributes';
import MessagePrintFooter from './MessagePrintFooter';

interface Props {
    iframeRef: RefObject<HTMLIFrameElement>;
    content: string;
    showBlockquote: boolean;
    showBlockquoteToggle: boolean;
    blockquoteContent: string;
    isPlainText: boolean;
    onBlockquoteToggle?: () => void;
    onContentLoaded: (iframeRootElement: HTMLDivElement) => void;
    isPrint?: boolean;
    hasDarkStyles?: boolean;
    message: MessageState;
    labelID: string;
    onReady?: (iframeRef: RefObject<HTMLIFrameElement>) => void;
    onMailTo?: (src: string) => void;
    isOutside?: boolean;
    mailSettings?: MailSettings;
}

const MessageBodyIframe = ({
    iframeRef,
    content,
    blockquoteContent,
    showBlockquote: showBlockquoteProp,
    showBlockquoteToggle,
    onBlockquoteToggle,
    onContentLoaded,
    isPlainText,
    hasDarkStyles,
    isPrint = false,
    message,
    labelID,
    onReady,
    onMailTo,
    isOutside,
    mailSettings,
}: Props) => {
    const messageHead = locateHead(message.messageDocument?.document);
    const hasAttachment = hasAttachments(message.data);

    const { isResizing } = useMailboxContainerContext();

    const { initStatus, iframeRootDivRef } = useInitIframeContent({
        messageID: message.data?.ID,
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
    const iframePrintHeaderDiv = iframeRef.current?.contentDocument?.getElementById(MESSAGE_IFRAME_PRINT_HEADER_ID);
    const iframePrintFooterDiv = iframeRef.current?.contentDocument?.getElementById(MESSAGE_IFRAME_PRINT_FOOTER_ID);

    const { modal: linkModal } = useLinkHandler(iframeRootDivRef, mailSettings, {
        onMailTo,
        startListening: initStatus === 'done' && iframeRootDivRef.current !== undefined,
        isOutside,
    });

    useIframeDispatchEvents(initStatus, iframeRef);

    useObserveIframeHeight(initStatus === 'done', iframeRef);

    useEffect(() => {
        if (iframeRootDivRef.current) {
            iframeRootDivRef.current?.classList[hasDarkStyles ? 'add' : 'remove']('proton-dark-style');
        }
    }, [hasDarkStyles, iframeRootDivRef.current]);

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
                sandbox={getIframeSandboxAttributes(isPrint)}
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
                            className="proton-toggle-button inline-flex"
                            onClick={() => {
                                setShowBlockquote(!showBlockquote);
                            }}
                            data-testid="message-view:expand-codeblock"
                        >
                            <Icon name="ellipsis" size={14} className="mauto" />
                            <span className="proton-sr-only">
                                {showBlockquote
                                    ? c('Info').t`Hide original message`
                                    : c('Info').t`Show original message`}
                            </span>
                        </button>
                    </Tooltip>,
                    iframeToggleDiv
                )}
            {isPrint &&
                iframePrintHeaderDiv &&
                createPortal(<MessagePrintHeader message={message} labelID={labelID} />, iframePrintHeaderDiv)}
            {hasAttachment &&
                isPrint &&
                iframePrintFooterDiv &&
                createPortal(<MessagePrintFooter message={message} />, iframePrintFooterDiv)}
            {linkModal}
        </>
    );
};

export default MessageBodyIframe;
