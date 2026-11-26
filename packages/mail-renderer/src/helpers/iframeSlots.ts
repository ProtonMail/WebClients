import getRandomString from '@proton/utils/getRandomString';

import { MESSAGE_IFRAME_SLOT_ATTRIBUTE } from '../constants';

/**
 * Email content is written into the same document as the iframe slots (`proton-root`, `proton-toggle`, ...)
 * and can carry the same ids, so slots are never looked up by id in the document. Each render marks its
 * slots with a random token, `registerIframeSlots` keeps a reference to the marked elements and removes the token.
 */
const slotsByDocument = new WeakMap<Document, Map<string, HTMLElement>>();

export const createIframeSlotToken = () => getRandomString(32);

export const getIframeSlotAttribute = (token: string) => `${MESSAGE_IFRAME_SLOT_ATTRIBUTE}="${token}"`;

export const registerIframeSlots = (doc: Document, token: string) => {
    const slots = new Map<string, HTMLElement>();

    doc.querySelectorAll<HTMLElement>(`[${getIframeSlotAttribute(token)}]`).forEach((element) => {
        if (element.id && !slots.has(element.id)) {
            slots.set(element.id, element);
        }
        element.removeAttribute(MESSAGE_IFRAME_SLOT_ATTRIBUTE);
    });

    slotsByDocument.set(doc, slots);
};

export const getIframeSlot = <T extends HTMLElement = HTMLElement>(
    doc: Document | null | undefined,
    id: string
): T | null => {
    const slot = doc ? slotsByDocument.get(doc)?.get(id) : undefined;
    return slot?.isConnected && slot.ownerDocument === doc ? (slot as T) : null;
};
