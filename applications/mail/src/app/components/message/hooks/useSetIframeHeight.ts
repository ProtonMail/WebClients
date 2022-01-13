import { RefObject, useCallback } from 'react';
import { debounce } from '@proton/shared/lib/helpers/function';

import { MESSAGE_IFRAME_ROOT_ID } from '../constants';

const useSetIframeHeight = (iframeRef: RefObject<HTMLIFrameElement>) => {
    const setIframeHeight = useCallback(
        debounce(() => {
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
        }, 50),
        []
    );

    return setIframeHeight;
};

export default useSetIframeHeight;
