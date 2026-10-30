import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';

import type { MessageState } from '../../store/messages/messagesTypes';
import { insertActualEmbeddedImages } from './messageEmbeddeds';
import { replaceProxyWithOriginalURLAttributes } from './messageImages';

export const prepareExport = (message: MessageState) => {
    if (!message.messageDocument?.document) {
        return '';
    }

    const document = message.messageDocument.document.cloneNode(true) as Element;

    // Using create element will create a DOM element that will not be added to the window's document, but images will be loaded
    // Use a DOMParser instead so that images are not loaded.
    const dom = parseStringToDOM(document.innerHTML);

    // Embedded images
    insertActualEmbeddedImages(dom.body);

    // Clean remote images
    return replaceProxyWithOriginalURLAttributes(message, dom.body);
};
