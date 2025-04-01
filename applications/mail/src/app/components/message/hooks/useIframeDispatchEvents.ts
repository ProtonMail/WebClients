import type { RefObject } from 'react';
import { useCallback, useEffect } from 'react';

import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import { cloneEvent, isKeyboardEvent } from '@proton/shared/lib/helpers/events';
import { removeProxyUrlsFromContent } from '@proton/shared/lib/mail/images';

const IFRAME_EVENTS_LIST: Event['type'][] = ['focus', 'keydown', 'click', 'copy'];

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

        /*
         * When the user has the setting "Block email tracking" enabled, we are loading images through the Proton proxy.
         * It means that we load the image with a URL which looks like:
         * "https://mail.proton.me/api/core/v4/images?Url={OriginalURL}&DryRun=0&UID={UID}"
         * However, when the user is copying content from an email (including images) and pasting them somewhere else, they
         * won't be loaded. Additionally, we don't want to leak the UID.
         * What we want to do on copy it to replace the proxy URL with the original image URL.
         */
        if (event.type === 'copy') {
            // Get user selection in iframe
            const selection = iframeRef.current?.contentWindow?.getSelection();
            const range = selection?.getRangeAt(0);

            if (range) {
                // Clone content so that we can apply transformations to it
                const clonedSelection = range.cloneContents();

                // Serialize the cloned content to an HTML string
                const serializer = new XMLSerializer();
                const html = Array.from(clonedSelection.childNodes)
                    .map((node) => serializer.serializeToString(node))
                    .join('');

                // Convert the HTML string into a document for manipulation
                const selectionContent = parseStringToDOM(html);

                // Replace all proxy images with their original URL
                const updatedContent = removeProxyUrlsFromContent(selectionContent);

                // Update clipboard data with the updated HTML and plaintext
                const updatedEvent = event as ClipboardEvent;
                updatedEvent.clipboardData?.setData('text/html', updatedContent.body.innerHTML);
                updatedEvent.clipboardData?.setData('text/plain', updatedContent.body.innerText);
                event.preventDefault();
            }
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
