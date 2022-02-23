import { RefObject, useCallback, useEffect } from 'react';

const useIframeDispatchEvents = (
    initStatus: 'start' | 'base_content' | 'done',
    iframeRef: RefObject<HTMLIFrameElement>,
    parentMessageRef?: RefObject<HTMLElement>
) => {
    const bubbleEventCallback = useCallback(() => {
        document.dispatchEvent(new CustomEvent('dropdownclose'));
        parentMessageRef?.current?.focus();
    }, []);

    useEffect(() => {
        const emailContentRoot = iframeRef.current?.contentWindow?.document.body;

        if (initStatus !== 'done' || !emailContentRoot) {
            return;
        }

        emailContentRoot.addEventListener('focus', bubbleEventCallback);
        emailContentRoot.addEventListener('click', bubbleEventCallback);

        return () => {
            emailContentRoot.removeEventListener('focus', bubbleEventCallback);
            emailContentRoot.removeEventListener('click', bubbleEventCallback);
        };
    }, [initStatus]);
};

export default useIframeDispatchEvents;
