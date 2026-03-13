import type { MaybeNull } from '@proton/pass/types';

export const isHTMLElement = (node: Node | EventTarget): node is HTMLElement =>
    'nodeType' in node && node.nodeType === Node.ELEMENT_NODE && 'tagName' in node;

export const isInputElement = (node: MaybeNull<Node | EventTarget>): node is HTMLInputElement =>
    Boolean(node && isHTMLElement(node) && node.tagName === 'INPUT');

export const isSelectElement = (node: Node | EventTarget): node is HTMLSelectElement =>
    isHTMLElement(node) && node.tagName === 'SELECT';

const INPUT_TYPES = ['text', 'email', 'number', 'tel', 'password'];

export const isValidInputElement = (node: Node | EventTarget): node is HTMLInputElement =>
    isInputElement(node) && INPUT_TYPES.includes(node.type);

export const isFormElement = (node: Node | EventTarget): node is HTMLFormElement =>
    isHTMLElement(node) && node.tagName === 'FORM';
