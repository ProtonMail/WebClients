import { RefObject, useEffect, useRef, useState } from 'react';

import { debounce } from '@proton/shared/lib/helpers/function';
import { useTheme } from '@proton/components';
import { PROTON_THEMES_MAP } from '@proton/shared/lib/themes/themes';

import { MESSAGE_IFRAME_BLOCKQUOTE_ID, MESSAGE_IFRAME_ROOT_ID, MESSAGE_IFRAME_TOGGLE_ID } from '../constants';
import getIframeHtml from '../helpers/getIframeHtml';

interface Props {
    content: string;
    messageHead: string | undefined;
    iframeRef: RefObject<HTMLIFrameElement>;
    isPlainText: boolean;
    onContentLoaded: (iframeRootElement: HTMLDivElement) => void;
    setIframeHeight: () => void;
    onReady?: (iframe: RefObject<HTMLIFrameElement>) => void;
}

const useInitIframeContent = ({
    iframeRef,
    setIframeHeight,
    messageHead,
    content,
    onContentLoaded,
    isPlainText,
    onReady,
}: Props) => {
    const [initStatus, setInitStatus] = useState<'start' | 'base_content' | 'done'>('start');
    const hasBeenDone = useRef<boolean>(false);
    const iframeRootDivRef = useRef<HTMLDivElement>();
    const prevContentRef = useRef<string>(content);
    const [themeIndex] = useTheme();
    const themeCSSVariables: string = PROTON_THEMES_MAP[themeIndex].theme;

    useEffect(() => {
        if (initStatus === 'start') {
            let emailContent = content;

            if (!isPlainText) {
                emailContent += `<div id="${MESSAGE_IFRAME_TOGGLE_ID}"></div><div id="${MESSAGE_IFRAME_BLOCKQUOTE_ID}"></div>`;
            }

            const doc = iframeRef.current?.contentDocument;
            const iframeContent = getIframeHtml(emailContent, messageHead, isPlainText, themeCSSVariables);
            doc?.open();
            doc?.write(iframeContent);
            doc?.close();

            const iframeRootDivElement = doc?.getElementById(MESSAGE_IFRAME_ROOT_ID) as HTMLDivElement;
            iframeRootDivRef.current = iframeRootDivElement;

            setInitStatus('base_content');
            return;
        }

        if (initStatus === 'base_content') {
            setIframeHeight();
            setInitStatus('done');
            return;
        }

        if (initStatus === 'done' && onContentLoaded && hasBeenDone.current === false) {
            const doc = iframeRef.current?.contentDocument;
            const iframeRootDivElement = doc?.getElementById(MESSAGE_IFRAME_ROOT_ID) as HTMLDivElement;

            onReady?.(iframeRef);
            hasBeenDone.current = true;

            const debouncedContentLoaded = debounce(() => {
                onContentLoaded(iframeRootDivElement);
            }, 200);
            debouncedContentLoaded();

            return () => {
                debouncedContentLoaded.abort();
            };
        }
    }, [initStatus]);

    /**
     * On content change, rerun the process to set content
     * inside the iframe
     */
    useEffect(() => {
        if (initStatus === 'done' && prevContentRef.current !== content) {
            setInitStatus('start');
            prevContentRef.current = content;
        }
    }, [content, initStatus]);

    return { initStatus, iframeRootDivRef };
};

export default useInitIframeContent;
