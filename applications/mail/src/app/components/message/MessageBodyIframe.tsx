import type { RefObject } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import { Icon, useSyncIframeStyles, useTheme } from '@proton/components';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useMailboxContainerContext } from '../../containers/mailbox/MailboxContainerProvider';
import type { MessageState } from '../../store/messages/messagesTypes';
import MessageBodyImages from './MessageBodyImages';
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
    onContentLoaded: (iframeRootDivRef: HTMLDivElement) => void;
    isPrint?: boolean;
    hasDarkStyles?: boolean;
    message: MessageState;
    onReady?: (iframeRef: RefObject<HTMLIFrameElement>) => void;
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
    onReady,
    mailSettings,
    onFocus,
}: Props) => {
    const theme = useTheme();

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

    useIframeDispatchEvents(initStatus === 'done', iframeRef, onFocus, isPlainText);

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
                className={clsx([initStatus !== 'start' ? 'w-full' : 'w-0 h-0', isResizing && 'pointer-events-none'])}
                data-testid="content-iframe"
                data-subject={message.data?.Subject}
                sandbox={getIframeSandboxAttributes(isPrint)}
                allowFullScreen={false}
                translate="yes"
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
                            className="proton-toggle-button"
                            onClick={() => {
                                setShowBlockquote(!showBlockquote);
                            }}
                            data-testid="message-view:expand-codeblock"
                        >
                            <Icon name="three-dots-horizontal" size={3.5} className="m-auto" />
                            <span className="proton-sr-only">
                                {showBlockquote
                                    ? c('Info').t`Hide original message`
                                    : c('Info').t`Show original message`}
                            </span>
                        </button>
                    </Tooltip>,
                    iframeToggleDiv
                )}
        </>
    );
};

export default MessageBodyIframe;
