import { cloneEvent, isKeyboardEvent } from '@proton/shared/lib/helpers/events';
import { isValidShortcut } from '@proton/shared/lib/shortcuts/helpers';
import { actionShortcuts } from '@proton/shared/lib/shortcuts/mail';
import { RefObject, useCallback, useEffect } from 'react';

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
            Object.values(actionShortcuts).forEach((shortcut) => {
                if (isValidShortcut(shortcut, event)) {
                    const clonedEvent = cloneEvent(event);
                    iframeRef.current?.dispatchEvent(clonedEvent);
                }
            });
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
