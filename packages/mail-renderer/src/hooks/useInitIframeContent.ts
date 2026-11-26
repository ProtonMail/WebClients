import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { ThemeContextInterface } from '@proton/components/containers/themes/ThemeProvider';
import useIsMounted from '@proton/hooks/useIsMounted';
import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { getIframeDocument } from '../helpers/getIframeDocument';
import writeIframeContent from '../helpers/writeIframeContent';

interface Props {
    messageID: string | undefined;
    content: string;
    message: MessageState;
    iframeRef: RefObject<HTMLIFrameElement | null>;
    isPlainText: boolean;
    onContentLoaded: (iframeRootDiv: HTMLDivElement) => void;
    onReady?: (iframe: RefObject<HTMLIFrameElement | null>) => void;
    isPrint: boolean;
    theme: ThemeContextInterface;
    iframeCSSStyles: string;
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
}: Props) => {
    const [initStatus, setInitStatus] = useState<'start' | 'done'>('start');
    const iframeRootDivRef = useRef<HTMLDivElement>(undefined);
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

            iframeRootDivRef.current = writeIframeContent(doc, {
                content,
                messageDocument: message.messageDocument?.document,
                isPlainText,
                themeCSSVariables,
                isPrint,
                iframeCSSStyles,
            });

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
