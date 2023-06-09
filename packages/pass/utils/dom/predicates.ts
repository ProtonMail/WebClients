export const isInputElement = (el: HTMLElement): el is HTMLInputElement => el.tagName === 'INPUT';
export const isFormElement = (el: HTMLElement): el is HTMLFormElement => el.tagName === 'FORM';
export const isHTMLElement = (el: Node): el is HTMLElement => el.nodeType === Node.ELEMENT_NODE;
