import { DragEvent } from 'react';
import declassify from 'declassify';
import juice from 'juice/client';
import cheerio from 'cheerio';

import { BLOCKQUOTE_SELECTORS } from './message/messageBlockquote';

const JUICE_OPTIONS = {
    applyAttributesTableElements: false,
    removeStyleTags: true,
    preserveFontFaces: false,
    preserveImportant: false,
    preserveMediaQueries: false,
    preserveKeyFrames: false,
    preservePseudos: false,
};

const DECLASSIFY_OPTIONS = {
    ignore: BLOCKQUOTE_SELECTORS.filter((selector) => selector.startsWith('.'))
        .map((selector) => selector.replace('.', ''))
        .concat(/proton-.*/ as any)
        .concat(/protonmail.*/ as any),
};

const LIST_STYLE_PROPERTIES_REMOVED = ['position', 'left', 'right', 'top', 'bottom'];

/**
 * Inline css into an element and remove all obsolete class names.
 */
export const inlineCss = (document: Element) => {
    try {
        const cheerioDoc = (cheerio as any).load(document.innerHTML);
        juice.juiceDocument(cheerioDoc, JUICE_OPTIONS);
        declassify.pruneAttrs(['id', 'class'], cheerioDoc, DECLASSIFY_OPTIONS.ignore);
        // Extra security not to leak any global styling
        cheerioDoc('style').remove();
        // Remove a selection of forbidden style props
        cheerioDoc('[style]').each((i: any, e: any) => {
            const element = cheerio(e);
            LIST_STYLE_PROPERTIES_REMOVED.forEach((prop) => {
                if (element.css(prop)) {
                    element.css(prop, '');
                }
            });
        });
        document.innerHTML = cheerioDoc.html();
    } catch (err: any) {
        console.error(err);
    }
};

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

export const preloadImage = async (url: string) =>
    new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.src = url;
        img.onload = resolve;
        img.onerror = reject;
    });
