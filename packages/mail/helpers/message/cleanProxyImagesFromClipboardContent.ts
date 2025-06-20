import { PROXY_IMG_URL } from '@proton/shared/lib/api/images';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import { removeProxyUrlsFromContent } from '@proton/shared/lib/mail/images';

import { toText } from 'proton-mail/helpers/parserHtml';

/**
 * When the user has the setting "Block email tracking" enabled, we are loading images through the Proton proxy.
 * However, when the user is copying content from an email (including images) and pasting them somewhere else, they
 * won't be loaded. Additionally, we don't want to leak the UID.
 */
export const cleanProxyImagesFromClipboardContent = (
    type: 'copy' | 'drag',
    event: Event,
    selection: Selection | null | undefined
) => {
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

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

        // Update clipboard data / data transfer with the updated HTML and plaintext
        if (type === 'copy') {
            const updatedEvent = event as ClipboardEvent;
            updatedEvent.clipboardData?.setData('text/html', updatedContent.body.innerHTML);
            updatedEvent.clipboardData?.setData('text/plain', toText(updatedContent.body.innerHTML));
            event.preventDefault();
        } else if (type === 'drag') {
            const updatedEvent = event as DragEvent;
            updatedEvent.dataTransfer?.setData('text/html', updatedContent.body.innerHTML);
            updatedEvent.dataTransfer?.setData('text/plain', toText(updatedContent.body.innerHTML));
        }
    } else if (type === 'drag' && event.target && (event.target as HTMLElement).tagName === 'IMG') {
        // When the user is doing a drag&drop on a single image, we cannot get a range, of course the range's content.
        // In that case, we need to replace the proxy url manually
        const updatedEvent = event as DragEvent;
        const clonedImg = (event.target as HTMLImageElement).cloneNode(true) as HTMLImageElement;

        const isProxyUrl = clonedImg.src.includes(PROXY_IMG_URL);
        if (isProxyUrl) {
            const originalUrl = new URL(clonedImg.src).searchParams.get('Url');

            if (originalUrl) {
                clonedImg.setAttribute('src', originalUrl);

                updatedEvent.dataTransfer?.setData('text/html', clonedImg.outerHTML);
                updatedEvent.dataTransfer?.setData('text/plain', toText(clonedImg.outerHTML));
            }
        }
    }
};
