import { RefObject, useEffect, useRef, useState } from 'react';

import { useTheme } from '@proton/components';
import useIsMounted from '@proton/hooks/useIsMounted';
import { PROTON_THEMES_MAP } from '@proton/shared/lib/themes/themes';
import debounce from '@proton/utils/debounce';

import { MessageState } from '../../../logic/messages/messagesTypes';
import { MESSAGE_IFRAME_BLOCKQUOTE_ID, MESSAGE_IFRAME_ROOT_ID, MESSAGE_IFRAME_TOGGLE_ID } from '../constants';
import getIframeHtml from '../helpers/getIframeHtml';

interface Props {
    messageID: string | undefined;
    content: string;
    message: MessageState;
    iframeRef: RefObject<HTMLIFrameElement>;
    isPlainText: boolean;
    onContentLoaded: (iframeRootElement: HTMLDivElement) => void;
    onReady?: (iframe: RefObject<HTMLIFrameElement>) => void;
}

const useInitIframeContent = ({
    messageID,
    iframeRef,
    message,
    content,
    onContentLoaded,
    isPlainText,
    onReady,
}: Props) => {
    const [initStatus, setInitStatus] = useState<'start' | 'done'>('start');
    const hasBeenDone = useRef<boolean>(false);
    const iframeRootDivRef = useRef<HTMLDivElement>();
    const prevContentRef = useRef<string>(content);
    const [themeIndex] = useTheme();
    const themeCSSVariables: string = PROTON_THEMES_MAP[themeIndex].theme;
    const isMounted = useIsMounted();

    useEffect(() => {
        if (initStatus === 'start') {
            let emailContent = content;

            if (!isPlainText) {
                emailContent += `<div id="${MESSAGE_IFRAME_TOGGLE_ID}"></div><div id="${MESSAGE_IFRAME_BLOCKQUOTE_ID}"></div>`;
            }

            const doc = iframeRef.current?.contentDocument;
            const iframeContent = getIframeHtml(emailContent, message, isPlainText, themeCSSVariables);
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

            const debouncedContentLoaded = debounce(() => {
                if (isMounted()) {
                    onContentLoaded(iframeRootDivElement);
                }
            }, 200);
            debouncedContentLoaded();
        }
    }, [initStatus]);

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
