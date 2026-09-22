import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { ThemeContextInterface } from '@proton/components/containers/themes/ThemeProvider';
import useIsMounted from '@proton/hooks/useIsMounted';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import {
    MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID,
    MESSAGE_IFRAME_BLOCKQUOTE_ID,
    MESSAGE_IFRAME_ROOT_ID,
    MESSAGE_IFRAME_TOGGLE_ID,
} from '../constants';
import { getIframeDocument } from '../helpers/getIframeDocument';
import getIframeHtml from '../helpers/getIframeHtml';

interface Props {
    messageID: string | undefined;
    content: string;
    message: MessageState;
    iframeRef: RefObject<HTMLIFrameElement>;
    isPlainText: boolean;
    onContentLoaded: (iframeRootDiv: HTMLDivElement) => void;
    onReady?: (iframe: RefObject<HTMLIFrameElement>) => void;
    isPrint: boolean;
    theme: ThemeContextInterface;
    iframeCSSStyles: string;
    iframeSVG: string;
}

const useInitIframeContent = ({
    messageID,
    iframeRef,
    message,
    content,
    onContentLoaded,
    isPlainText,
    onReady,
    isPrint,
    theme,
    iframeCSSStyles,
    iframeSVG,
}: Props) => {
    const [initStatus, setInitStatus] = useState<'start' | 'done'>('start');
    const iframeRootDivRef = useRef<HTMLDivElement>();
    const prevContentRef = useRef<string>(content);
    const themeIndex = theme.information.theme;
    const themeCSSVariables = theme.information.style;
    const isMounted = useIsMounted();
    const themeRef = useRef(themeIndex);
    const hasReportedUnreachableDocumentRef = useRef(false);

    useEffect(() => {
        if (initStatus === 'start') {
            const doc = getIframeDocument(iframeRef.current);

            if (!doc) {
                if (!hasReportedUnreachableDocumentRef.current) {
                    hasReportedUnreachableDocumentRef.current = true;
                    captureMessage('Message iframe document is unreachable', {
                        level: 'error',
                        extra: { isPlainText, isPrint },
                    });
                }

                iframeRootDivRef.current = undefined;
                setInitStatus('done');
                return;
            }

            let emailContent = content;

            if (!isPlainText) {
                emailContent += `<div id='${MESSAGE_IFRAME_TOGGLE_ID}'></div><div id='${MESSAGE_IFRAME_BLOCKQUOTE_ID}'></div><div id='${MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID}'></div>`;
            }

            const iframeContent = getIframeHtml({
                emailContent,
                messageDocument: message.messageDocument?.document,
                isPlainText,
                themeCSSVariables,
                isPrint,
                iframeCSSStyles,
                iframeSVG,
            });
            doc.open();
            doc.write(iframeContent);
            doc.close();

            const iframeRootDivElement = doc.getElementById(MESSAGE_IFRAME_ROOT_ID) as HTMLDivElement;
            iframeRootDivRef.current = iframeRootDivElement;

            setInitStatus('done');
            return;
        }

        if (initStatus === 'done' && onContentLoaded) {
            onReady?.(iframeRef);

            if (isMounted() && iframeRootDivRef.current) {
                onContentLoaded(iframeRootDivRef.current);
            }
        }
    }, [initStatus]);

    // When theme is updated, need to compute again the styles so that plaintext messages use the correct bg color
    useEffect(() => {
        if (themeIndex !== themeRef.current) {
            setInitStatus('start');
            themeRef.current = themeIndex;
        }
    }, [themeIndex]);

    /**
     * On content change, rerun the process to set content inside the iframe
     */
    useEffect(() => {
        if (initStatus === 'done' && prevContentRef.current !== content) {
            setInitStatus('start');
            prevContentRef.current = content;
        }
    }, [content, initStatus]);

    /**
     * On message change, rerun the process to set content too
     */
    useEffect(() => {
        if (initStatus === 'done') {
            setInitStatus('start');
        }
    }, [messageID]);

    return { initStatus, iframeRootDivRef };
};

export default useInitIframeContent;
