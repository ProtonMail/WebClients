export const isHTMLElement = (node: Node | EventTarget): node is HTMLElement =>
    'nodeType' in node && node.nodeType === Node.ELEMENT_NODE && 'tagName' in node;

export const isInputElement = (node: Node | EventTarget): node is HTMLInputElement =>
    isHTMLElement(node) && node.tagName === 'INPUT';

const INPUT_TYPES = ['text', 'email', 'number', 'tel', 'password'];

export const isValidInputElement = (node: Node | EventTarget): node is HTMLInputElement =>
    isInputElement(node) && INPUT_TYPES.includes(node.type);

export const isFormElement = (node: Node | EventTarget): node is HTMLFormElement =>
    isHTMLElement(node) && node.tagName === 'FORM';
