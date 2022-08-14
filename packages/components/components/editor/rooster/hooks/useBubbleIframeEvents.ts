import { RefObject, useCallback, useEffect } from 'react';

import { cloneEvent, isKeyboardEvent } from '@proton/shared/lib/helpers/events';
import { KeyboardKey } from '@proton/shared/lib/interfaces';
import { isValidShortcut } from '@proton/shared/lib/shortcuts/helpers';
import { editorShortcuts } from '@proton/shared/lib/shortcuts/mail';

import { IFRAME_EVENTS_LIST, ROOSTER_EDITOR_WRAPPER_ID } from '../../constants';

const PAGE_EVENTS = [KeyboardKey.PageUp, KeyboardKey.PageDown];

/**
 * Calls event.preventDefault on matched events
 * Because events occuring inside an iframe can show prompts in browsers (ex : pressing crtl+s)
 * we need some specific event management here
 */
const preventKeyboardEvents = (event: Event) => {
    if (isKeyboardEvent(event)) {
        Object.values(editorShortcuts).forEach((shortcut) => {
            if (
                isValidShortcut(shortcut, event) ||
                // Need to wait for this issue to be fixed
                // https://bugs.chromium.org/p/chromium/issues/detail?id=890248
                PAGE_EVENTS.includes(event.key as KeyboardKey)
            ) {
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
        preventKeyboardEvents(event);

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
