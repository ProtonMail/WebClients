import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';

/**
 * Returns whether the element is a node.
 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType}
 */
export const isElement = (node: Node | null) => node && node.nodeType === 1;

export const matches = (element: Element, selector: string) =>
    (element.matches || (element as any).msMatchesSelector).call(element, selector);

/**
 * Check if a HTML content is considered empty
 */
export const isHTMLEmpty = (html: string) => {
    if (!html) {
        return true;
    }

    const div = parseStringToDOM(html).body;

    return div.textContent?.trim() === '' && div.querySelectorAll('img').length === 0;
};

// https://github.com/chimurai/http-proxy-middleware/issues/237#issue-294034608
export const createErrorHandler = (reject: (error: Error) => void) => {
    return (event: any) => {
        const error = new Error(`Failed to load ${event?.target?.src}`);
        (error as any).event = event;
        reject(error);
    };
};
