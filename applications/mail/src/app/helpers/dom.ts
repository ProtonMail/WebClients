import { DragEvent } from 'react';

export const escapeSrc = (value = '') => value.replace(/ src=/g, ' data-src=');
export const unescapeSrc = (value = '') => value.replace(/ data-src=/g, ' src=');

/**
 * Returns whether the element is a node.
 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType}
 */
export const isElement = (node: Node | null) => node && node.nodeType === 1;

/**
 * Returns the node if it's an element or the parent element if not
 */
export const getElement = (node: Node | null) => (isElement(node) ? (node as Element) : node?.parentElement || null);

export const matches = (element: Element, selector: string) =>
    (element.matches || (element as any).msMatchesSelector).call(element, selector);

export const wrap = (element: Element, html: string) => {
    const container = document.createElement('div');
    container.innerHTML = html;

    const wrapper = container.firstChild as Element;

    wrapper.innerHTML = element.outerHTML;

    element.parentNode?.insertBefore(wrapper, element);
    element.remove();

    return wrapper;
};

export const parseInDiv = (content: string) => {
    const div = document.createElement('div');
    div.innerHTML = content;
    return div;
};

export const isDragFile = (event: DragEvent) => event.dataTransfer?.types.includes('Files');

/**
 * Move the textarea cursor to the front.
 */
export const setTextAreaCursorStart = (textarea: HTMLTextAreaElement) => {
    textarea.selectionStart = 0;
    textarea.selectionEnd = 0;
    textarea.scrollTop = 0;
};

/**
 * Check if a HTML content is considered empty
 */
export const isHTMLEmpty = (html: string) => !html || html === '<div><br /></div>' || html === '<div><br></div>';

// https://github.com/chimurai/http-proxy-middleware/issues/237#issue-294034608
export const createErrorHandler = (reject: (error: Error) => void) => {
    return (event: any) => {
        const error = new Error(`Failed to load ${event?.target?.src}`);
        (error as any).event = event;
        reject(error);
    };
};

export const preloadImage = async (url: string) =>
    new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.src = url;
        img.onload = resolve;
        img.onerror = createErrorHandler(reject);
    });
