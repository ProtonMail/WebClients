import { RefObject, useCallback, useEffect } from 'react';

import { cloneEvent, isKeyboardEvent } from '@proton/shared/lib/helpers/events';

const IFRAME_EVENTS_LIST: Event['type'][] = ['focus', 'keydown', 'click'];

const useIframeDispatchEvents = (
    startListening: boolean,
    iframeRef: RefObject<HTMLIFrameElement>,
    onFocus?: () => void
) => {
    const bubbleEventCallback = useCallback((event: Event) => {
        if (['click', 'focus'].includes(event.type)) {
            document.dispatchEvent(new CustomEvent('dropdownclose'));
            onFocus?.();
        }

        if (isKeyboardEvent(event)) {
            // In order to prevent focus we need to not bubble tab key
            if (event.key.toLowerCase() === 'tab') {
                return false;
            }

            const clonedEvent = cloneEvent(event);
            iframeRef.current?.dispatchEvent(clonedEvent);
        }
    }, []);

    useEffect(() => {
        const emailContentRoot = iframeRef.current?.contentWindow?.document.body;

        if (startListening === false || !emailContentRoot) {
            return;
        }

        IFRAME_EVENTS_LIST.forEach((eventName) => {
            emailContentRoot.addEventListener(eventName, bubbleEventCallback);
        });

        return () => {
            IFRAME_EVENTS_LIST.forEach((eventName) => {
                emailContentRoot.removeEventListener(eventName, bubbleEventCallback);
            });
        };
    }, [startListening]);
};

export default useIframeDispatchEvents;
