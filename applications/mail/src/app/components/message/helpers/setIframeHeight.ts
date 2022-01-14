import { debounce } from '@proton/shared/lib/helpers/function';
import { RefObject } from 'react';
import { MESSAGE_IFRAME_ROOT_ID } from '../constants';

export const setIframeHeight = (iframeRef: RefObject<HTMLIFrameElement>) => {
    const { current: iframe } = iframeRef;
    const emailContentRoot = iframeRef.current?.contentWindow?.document.getElementById(MESSAGE_IFRAME_ROOT_ID);

    const emailContentRootHeight = emailContentRoot?.scrollHeight;

    if (!iframe || emailContentRootHeight === undefined) {
        return;
    }

    /**
     * Here to avoid unexpected sidebar appear.
     * Margin value is equal to 1rem in order to simulate
     * a normal margin at the bottom of the content.
     */
    const SAFETY_MARGIN = 16;
    const computedContentHeight = emailContentRootHeight ? emailContentRootHeight + SAFETY_MARGIN : 0;

    iframe.style.height = `${computedContentHeight}px`;
};

export const debouncedSetIframeHeight = debounce(
    (iframeRef: RefObject<HTMLIFrameElement>) => setIframeHeight(iframeRef),
    250
);
