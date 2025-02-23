export const isHTMLElement = (node: Node | EventTarget): node is HTMLElement =>
    `nodeType` in node && node.nodeType === Node.ELEMENT_NODE && 'tagName' in node;

export const isInputElement = (node: Node | EventTarget): node is HTMLInputElement =>
    isHTMLElement(node) && node.tagName === 'INPUT';

export const isFormElement = (node: Node | EventTarget): node is HTMLFormElement =>
    isHTMLElement(node) && node.tagName === 'FORM';
