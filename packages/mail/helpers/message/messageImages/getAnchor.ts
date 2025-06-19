import type { MessageImage } from '@proton/mail/store/messages/messagesTypes';

export const getAnchor = (document: Element | null | undefined, image: MessageImage) => {
    if (!document) {
        return null;
    }

    return document.querySelector(
        `.proton-image-anchor[data-proton-${image.type}="${image.id}"]`
    ) as HTMLElement | null;
};
