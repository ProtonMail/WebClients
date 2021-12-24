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

            iframe.style.height = `${emailContentRootHeight + 16}px`;
        }, 50),
        []
    );

    return setIframeHeight;
};

export default useSetIframeHeight;
