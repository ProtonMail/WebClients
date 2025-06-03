import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useTheme } from '@proton/components';
import useIsMounted from '@proton/hooks/useIsMounted';
import {
    MESSAGE_IFRAME_BLOCKQUOTE_ID,
    MESSAGE_IFRAME_ROOT_ID,
    MESSAGE_IFRAME_TOGGLE_ID,
} from '@proton/mail-renderer/constants';

import type { MessageState } from '../../../store/messages/messagesTypes';
import getIframeHtml from '../helpers/getIframeHtml';

interface Props {
    messageID: string | undefined;
    content: string;
    message: MessageState;
    iframeRef: RefObject<HTMLIFrameElement>;
    isPlainText: boolean;
    onContentLoaded: (iframeRootElement: HTMLDivElement) => void;
    onReady?: (iframe: RefObject<HTMLIFrameElement>) => void;
    isPrint: boolean;
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
}: Props) => {
    const [initStatus, setInitStatus] = useState<'start' | 'done'>('start');
    const hasBeenDone = useRef<boolean>(false);
    const iframeRootDivRef = useRef<HTMLDivElement>();
    const prevContentRef = useRef<string>(content);
    const theme = useTheme();
    const themeIndex = theme.information.theme;
    const themeCSSVariables = theme.information.style;
    const isMounted = useIsMounted();
    const themeRef = useRef(themeIndex);

    useEffect(() => {
        if (initStatus === 'start') {
            let emailContent = content;

            if (!isPlainText) {
                emailContent += `<div id='${MESSAGE_IFRAME_TOGGLE_ID}'></div><div id='${MESSAGE_IFRAME_BLOCKQUOTE_ID}'></div>`;
            }

            const doc = iframeRef.current?.contentDocument;
            const iframeContent = getIframeHtml({
                emailContent,
                messageDocument: message.messageDocument?.document,
                isPlainText,
                themeCSSVariables,
                isPrint,
            });
            doc?.open();
            doc?.write(iframeContent);
            doc?.close();

            const iframeRootDivElement = doc?.getElementById(MESSAGE_IFRAME_ROOT_ID) as HTMLDivElement;
            iframeRootDivRef.current = iframeRootDivElement;

            setInitStatus('done');
            return;
        }

        if (initStatus === 'done' && onContentLoaded && hasBeenDone.current === false) {
            const doc = iframeRef.current?.contentDocument;
            const iframeRootDivElement = doc?.getElementById(MESSAGE_IFRAME_ROOT_ID) as HTMLDivElement;

            onReady?.(iframeRef);
            hasBeenDone.current = true;

            if (isMounted()) {
                onContentLoaded(iframeRootDivElement);
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
