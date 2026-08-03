import { toText } from '@proton/mail/helpers/parserHtml';
import type { MessageState, PartialMessageState } from '@proton/mail/store/messages/messagesTypes';

export const getPlainTextContent = (message: PartialMessageState) => {
    return message.messageDocument?.plainText || '';
};

export const exportPlainText = (content: string) => {
    /*
     * The replace removes any characters that are produced by the copying process (like zero width characters)
     * See: http://www.berklix.org/help/majordomo/#quoted we want to avoid sending unnecessary quoted printable encodings
     */
    return toText(content).replace(/\u200B/g, '');
};

export const setPlainTextContent = (message: MessageState, content: string) => {
    if (message.messageDocument) {
        message.messageDocument.plainText = content;
    } else {
        message.messageDocument = { plainText: content };
    }
};
