import type { MessageState } from '@proton/mail-message/store/messages/messagesTypes';

import {
    MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID,
    MESSAGE_IFRAME_BLOCKQUOTE_ID,
    MESSAGE_IFRAME_ROOT_ID,
    MESSAGE_IFRAME_TOGGLE_ID,
} from '../constants';
import getIframeHtml from './getIframeHtml';
import { createIframeSlotToken, getIframeSlot, getIframeSlotAttribute, registerIframeSlots } from './iframeSlots';

interface Options {
    content: string;
    messageDocument: Required<MessageState>['messageDocument']['document'];
    isPlainText: boolean;
    themeCSSVariables: string;
    isPrint: boolean;
    iframeCSSStyles: string;
}

/**
 * Writes the message into the iframe document and returns the root slot.
 */
const writeIframeContent = (doc: Document, { content, ...options }: Options) => {
    const slotToken = createIframeSlotToken();
    const slotAttr = getIframeSlotAttribute(slotToken);
    let emailContent = content;

    if (!options.isPlainText) {
        emailContent += `<div id='${MESSAGE_IFRAME_TOGGLE_ID}' ${slotAttr}></div><div id='${MESSAGE_IFRAME_BLOCKQUOTE_ID}' ${slotAttr}></div><div id='${MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID}' ${slotAttr}></div>`;
    }

    const iframeContent = getIframeHtml({ ...options, emailContent, slotToken });
    doc.open();
    doc.write(iframeContent);
    doc.close();
    registerIframeSlots(doc, slotToken);

    return getIframeSlot<HTMLDivElement>(doc, MESSAGE_IFRAME_ROOT_ID) ?? undefined;
};

export default writeIframeContent;
