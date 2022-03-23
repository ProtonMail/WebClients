import { RefObject, useCallback, useEffect } from 'react';

const useIframeDispatchEvents = (
    startListening: boolean,
    iframeRef: RefObject<HTMLIFrameElement>,
    onFocus?: () => void
) => {
    const bubbleEventCallback = useCallback(() => {
        document.dispatchEvent(new CustomEvent('dropdownclose'));
        onFocus?.();
    }, []);

    useEffect(() => {
        const emailContentRoot = iframeRef.current?.contentWindow?.document.body;

        if (startListening === false || !emailContentRoot) {
            return;
        }

        emailContentRoot.addEventListener('focus', bubbleEventCallback);
        emailContentRoot.addEventListener('click', bubbleEventCallback);

        return () => {
            emailContentRoot.removeEventListener('focus', bubbleEventCallback);
            emailContentRoot.removeEventListener('click', bubbleEventCallback);
        };
    }, [startListening]);
};

export default useIframeDispatchEvents;
