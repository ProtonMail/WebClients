import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';

export const parseDOMStringToBodyElement = (content: string): Element => {
    const document = parseStringToDOM(content);
    return document.body;
};
