import type { PartialMessageState } from '@proton/mail/store/messages/messagesTypes';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';

export const getDocumentContent = (document: Element | undefined) => {
    const root = document?.querySelector('body') || document;
    return root?.innerHTML || '';
};

export const setDocumentContent = (document: Element | undefined, content: string) => {
    if (document) {
        document.innerHTML = content;
    } else {
        document = parseStringToDOM(content).body;
    }

    return document;
};

export const querySelectorAll = (message: PartialMessageState | undefined, selector: string) => [
    ...((message?.messageDocument?.document?.querySelectorAll(selector) || []) as HTMLElement[]),
];
