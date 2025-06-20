import type { RefObject } from 'react';
import { useCallback, useEffect } from 'react';

import { cleanProxyImagesFromClipboardContent } from '@proton/mail/helpers/message/cleanProxyImagesFromClipboardContent';
import { cloneEvent, isKeyboardEvent } from '@proton/shared/lib/helpers/events';

const IFRAME_EVENTS_LIST: Event['type'][] = ['focus', 'keydown', 'click', 'copy', 'dragstart'];

const useIframeDispatchEvents = (
    startListening: boolean,
    iframeRef: RefObject<HTMLIFrameElement>,
    onFocus?: () => void,
    isPlainText?: boolean
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

        /*
         * When the user has the setting "Block email tracking" enabled, we are loading images through the Proton proxy.
         * It means that we load the image with a URL which looks like:
         * "https://mail.proton.me/api/core/v4/images?Url={OriginalURL}&DryRun=0&UID={UID}"
         * However, when the user is copying content from an email (including images) and pasting them somewhere else, they
         * won't be loaded. Additionally, we don't want to leak the UID.
         * What we want to do on copy it to replace the proxy URL with the original image URL.
         *
         * If the content is already plaintext though, no need to search for images.
         */
        if (event.type === 'copy' && !isPlainText) {
            // Get user selection in iframe
            const selection = iframeRef.current?.contentWindow?.getSelection();
            cleanProxyImagesFromClipboardContent('copy', event, selection);
        }

        if (event.type === 'dragstart') {
            const selection = iframeRef.current?.contentWindow?.getSelection();
            cleanProxyImagesFromClipboardContent('drag', event, selection);
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
