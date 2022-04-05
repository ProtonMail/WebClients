import { isMac } from '@proton/shared/lib/helpers/browser';
import { RefObject, useCallback, useEffect } from 'react';
import { editorShortcuts } from '@proton/shared/lib/shortcuts/mail';
import { IFRAME_EVENTS_LIST, ROOSTER_EDITOR_WRAPPER_ID } from '../../constants';

const isDragEvent = (event: Event): event is DragEvent => {
    if ('dataTransfer' in event) {
        return true;
    }
    return false;
};

const isKeyboardEvent = (event: Event): event is KeyboardEvent => {
    if ('key' in event) {
        return true;
    }
    return false;
};

const assignKeyboardKeys = (customEvent: CustomEvent, event: Event) => {
    const KEYBOARD_EVENT_RELATED_KEYS = [
        'altKey',
        'charCode',
        'ctrlKey',
        'code',
        'key',
        'keyCode',
        'locale',
        'location',
        'metaKey',
        'repeat',
        'shiftKey',
    ];

    KEYBOARD_EVENT_RELATED_KEYS.forEach((key) => {
        // @ts-expect-error
        customEvent[key] = event[key];
    });
};

const cloneEvent = (event: Event) => {
    const clonedEvent = new CustomEvent(event.type, { bubbles: true });

    if (isDragEvent(event)) {
        // @ts-expect-error 'dataTransfert' key is not present in customEvent interface
        clonedEvent.dataTransfer = event.dataTransfer;
    }

    if (isKeyboardEvent(event)) {
        assignKeyboardKeys(clonedEvent, event);
    }

    return clonedEvent;
};

/**
 * Calls event.preventDefault on matched events
 * Because events occuring inside an iframe can show prompts in browsers (ex : pressing crtl+s)
 * we need some specific event management here
 */
const preventDefaultEvents = (event: Event) => {
    if (isKeyboardEvent(event)) {
        Object.values(editorShortcuts).forEach((shortcut) => {
            let isOk = shortcut.map(() => false);
            shortcut.forEach((key, index) => {
                const formattedKey = key.toLowerCase();
                let ok = false;

                if (formattedKey === 'meta') {
                    ok = isMac() ? event.metaKey : event.ctrlKey;
                }
                if (formattedKey === 'shift') {
                    ok = event.shiftKey;
                }

                if (formattedKey === event.key.toLowerCase()) {
                    ok = true;
                }

                if (ok) {
                    isOk[index] = true;
                }
            });

            if (isOk.every((item) => item === true)) {
                event.preventDefault();
            }
        });
    }
};

const canDispatchEvent = (event: Event): boolean => {
    if (isKeyboardEvent(event)) {
        // Cancel tab keyboard event dispatch for
        // keeping native focus management behavior
        if (event.key.toLowerCase() === 'tab') {
            return false;
        }
    }

    return true;
};

/**
 * Trigger some events manually because of Iframe stopping bubbling.
 * @param iframeRef
 */
const useBubbleIframeEvents = (iframeRef: RefObject<HTMLIFrameElement>) => {
    const handleBubble = useCallback((event: Event) => {
        const canDispatch = canDispatchEvent(event);
        preventDefaultEvents(event);

        if (canDispatch) {
            const clonedEvent = cloneEvent(event);
            iframeRef.current?.dispatchEvent(clonedEvent);
        }
    }, []);

    useEffect(() => {
        const iframeRoosterDiv = iframeRef.current?.contentDocument?.getElementById(ROOSTER_EDITOR_WRAPPER_ID);

        if (!iframeRoosterDiv) {
            return;
        }

        IFRAME_EVENTS_LIST.forEach((eventName) => {
            iframeRoosterDiv.addEventListener(eventName, handleBubble);
        });

        return () => {
            IFRAME_EVENTS_LIST.forEach((eventName) => {
                iframeRoosterDiv.removeEventListener(eventName, handleBubble);
            });
        };
    }, []);
};

export default useBubbleIframeEvents;
