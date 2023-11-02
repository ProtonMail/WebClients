import { RefObject, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { Icon, Tooltip, useSyncIframeStyles, useTheme } from '@proton/components';
import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { hasAttachments, isAutoFlaggedPhishing, isSuspicious } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { useMailboxContainerContext } from '../../containers/mailbox/MailboxContainerProvider';
import { MessageState } from '../../logic/messages/messagesTypes';
import MessageBodyImages from './MessageBodyImages';
import MessagePrintFooter from './MessagePrintFooter';
import MessagePrintHeader from './MessagePrintHeader';
import { MESSAGE_IFRAME_PRINT_FOOTER_ID, MESSAGE_IFRAME_PRINT_HEADER_ID } from './constants';
import getIframeSandboxAttributes from './helpers/getIframeSandboxAttributes';
import useIframeDispatchEvents from './hooks/useIframeDispatchEvents';
import useIframeShowBlockquote from './hooks/useIframeShowBlockquote';
import useInitIframeContent from './hooks/useInitIframeContent';
import useObserveIframeHeight from './hooks/useObserveIframeHeight';

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
    mailSettings: MailSettings;
    onFocus?: () => void;
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
    onFocus,
}: Props) => {
    const theme = useTheme();
    const hasAttachment = hasAttachments(message.data);

    useSyncIframeStyles(iframeRef.current?.contentWindow?.document.documentElement, document.documentElement);

    const { isResizing } = useMailboxContainerContext();

    const { initStatus, iframeRootDivRef } = useInitIframeContent({
        messageID: message.data?.ID,
        content,
        message,
        iframeRef,
        onContentLoaded,
        isPlainText,
        onReady,
        isPrint,
    });

    const { showToggle, iframeToggleDiv, showBlockquote, setShowBlockquote } = useIframeShowBlockquote({
        blockquoteContent,
        iframeRef,
        initStatus,
        showBlockquoteProp,
        showBlockquoteToggle,
        onBlockquoteToggle,
    });
    const iframePrintHeaderDiv = iframeRef.current?.contentDocument?.getElementById(MESSAGE_IFRAME_PRINT_HEADER_ID);
    const iframePrintFooterDiv = iframeRef.current?.contentDocument?.getElementById(MESSAGE_IFRAME_PRINT_FOOTER_ID);

    const { modal: linkModal } = useLinkHandler(iframeRootDivRef, mailSettings, {
        onMailTo,
        startListening: initStatus === 'done' && iframeRootDivRef.current !== undefined,
        isOutside,
        isPhishingAttempt: isAutoFlaggedPhishing(message.data) || isSuspicious(message.data),
    });

    useIframeDispatchEvents(initStatus === 'done', iframeRef, onFocus);

    useObserveIframeHeight(initStatus === 'done', iframeRef);

    useEffect(() => {
        if (iframeRootDivRef.current) {
            iframeRootDivRef.current?.classList[hasDarkStyles ? 'add' : 'remove']('proton-dark-style');
        }
    }, [hasDarkStyles]);

    useEffect(() => {
        /** Add class in case the user theme is dark. Helps fixing issues with dark themes */
        iframeRootDivRef.current?.classList[theme.information.dark ? 'add' : 'remove']('proton-dark-theme');
    }, [theme.information.dark]);

    return (
        <>
            <iframe
                title={c('Title').t`Email content`}
                src="about:blank"
                scrolling="yes"
                frameBorder="0"
                ref={iframeRef}
                className={clsx([initStatus !== 'start' ? 'w-full' : 'w-0 h-0', isResizing && 'no-pointer-events'])}
                data-testid="content-iframe"
                data-subject={message.data?.Subject}
                sandbox={getIframeSandboxAttributes(isPrint)}
                allowFullScreen={false}
            />
            {initStatus !== 'start' && (
                <MessageBodyImages
                    iframeRef={iframeRef}
                    isPrint={isPrint}
                    messageImages={message.messageImages}
                    localID={message.localID}
                    useProxy={!!mailSettings.ImageProxy}
                />
            )}
            {showToggle &&
                iframeToggleDiv &&
                createPortal(
                    <Tooltip
                        title={showBlockquote ? c('Info').t`Hide original message` : c('Info').t`Show original message`}
                        relativeReference={iframeRef}
                    >
                        <button
                            type="button"
                            className="proton-toggle-button inline-flex"
                            onClick={() => {
                                setShowBlockquote(!showBlockquote);
                            }}
                            data-testid="message-view:expand-codeblock"
                        >
                            <Icon name="three-dots-horizontal" size={14} className="m-auto" />
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
