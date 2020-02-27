import { Ref, RefObject, MutableRefObject } from 'react';
import Squire from 'squire-rte';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import { content } from '../purify';

export enum FONT_FACE {
    Georgia = 'georgia',
    Arial = 'arial',
    Helvetica = 'helvetica',
    Monospace = 'menlo, consolas, courier new, monospace',
    Tahoma = 'tahoma, sans-serif',
    Verdana = 'verdana',
    'Times New Roman' = 'times new roman',
    'Trebuchet MS' = 'trebuchet ms'
}

export const FONT_SIZES = [10, 12, 14, 16, 18, 20, 22, 24, 26];

export const FONT_COLORS = [
    /* white */
    '#FFFFFF',
    '#DADADA',
    '#B5B5B5',
    '#909090',
    '#6B6B6B',
    '#464646',
    '#222222',
    /* magenta */
    '#F6CBCB',
    '#EC9798',
    '#E36667',
    '#ED4139',
    '#CF3932',
    '#9A2B25',
    '#681D19',
    /* blue */
    '#CDE1F2',
    '#9CC3E5',
    '#6CA6D9',
    '#3B83C2',
    '#2A47F6',
    '#145390',
    '#0F3A62',
    /* green */
    '#D7EAD3',
    '#B3D6A9',
    '#8FC380',
    '#77F241',
    '#66A657',
    '#3A762B',
    '#29501F',
    /* yellow */
    '#FFF2CD',
    '#FEE59C',
    '#FCD86F',
    '#FDF84E',
    '#F2C246',
    '#BE8F35',
    '#7F6124'
];

export const HEADER_CLASS = 'h4';
export const IFRAME_CLASS = 'editor-squire-iframe';

export const DEFAULT_FONT_FACE = FONT_FACE.Arial;
export const DEFAULT_FONT_SIZE = 14;
export const DEFAULT_FONT_COLOR = '#222222';
export const DEFAULT_BACKGROUND = '#FFFFFF';
export const DEFAULT_LINK = '';
export const DEFAULT_IMAGE = '';

export const RGB_REGEX = /rgb\((\d+)\s*,\s*(\d+),\s*(\d+)\)/;

export interface SquireType {
    getDocument: () => Document;
    getHTML: () => string;
    setHTML: (content: string) => void;
    getPath: () => string;
    getSelection: () => Range;
    setSelection: (range: Range) => void;
    hasFormat: (tag: string, attributes?: { [key: string]: string }) => boolean;
    getFontInfo: () => {
        color: string | undefined;
        backgroundColor: string | undefined;
        family: string | undefined;
        size: string | undefined;
    };
    setFontFace: (fontFace: string) => void;
    setFontSize: (fontSize: string) => void;
    setTextColour: (color: string) => void;
    setHighlightColour: (color: string) => void;
    setTextAlignment: (alignment: string) => void;
    setTextDirection: (direction?: string) => void;
    forEachBlock: (callback: (block: Element) => void, mutates: boolean) => void;
    focus: () => void;
    bold: () => void;
    removeBold: () => void;
    italic: () => void;
    removeItalic: () => void;
    underline: () => void;
    removeUnderline: () => void;
    makeOrderedList: () => void;
    makeUnorderedList: () => void;
    removeList: () => void;
    increaseQuoteLevel: () => void;
    decreaseQuoteLevel: () => void;
    makeLink: (link: string, attributes?: { [key: string]: string | undefined }) => void;
    insertImage: (url: string, attributes?: { [key: string]: string | undefined }) => void;
    removeAllFormatting: () => void;
    addEventListener: (type: string, handler: (event: Event) => void) => void;
    removeEventListener: (type: string, handler: (event: Event) => void) => void;
    fireEvent: (type: string, event?: Event) => void;
}

export interface LinkData {
    link: string;
    title: string;
}

export const getSquireRef = (ref: Ref<SquireType>) => (ref as RefObject<SquireType>).current as SquireType;
export const setSquireRef = (ref: Ref<SquireType>, squire: Squire) =>
    (((ref as any) as MutableRefObject<Squire>).current = squire);

export const SQUIRE_CONFIG = {
    sanitizeToDOMFragment(html: string, isPaste: boolean, self: any) {
        // eslint-disable-next-line no-underscore-dangle
        const doc = self._doc;
        // Use proton's instance of DOMPurify to allow proton-src attributes to be displayed in squire.
        const frag = html ? content(html) : null;
        return frag ? doc.importNode(frag, true) : doc.createDocumentFragment();
    }
};

/**
 * Custom CSS inside the IFRAME
 */
export const insertCustomStyle = (document: Document) => {
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');

    const css = `
       html {
           height: 100%
       }

       body {
           height: 100%;
           box-sizing: border-box;
           padding: 1rem 10px 1rem 10px;
           font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
           font-size: 14px;
           line-height: 1.65em;
           color: ${getLightOrDark('#222', '#fff')};
           background: ${getLightOrDark('#fff', '#3c414e')};
           /* to fix, CSS var are not passing through the iframe */
           word-wrap: break-word;
           margin: 0;
       }

       body a {
           color: #657ee4;
       }

       blockquote {
           padding: 0 0 0 1rem;
           margin: 0;
           border-left: 4px solid #e5e5e5;
       }

       blockquote blockquote blockquote {
           padding-left: 0;
           margin-left: 0;
           border: none;
       }

       .proton-embedded:not([src]) {
           position: relative;
           min-height: 38px;
           border: 1px solid;
           border-color: #444 #CCC #CCC #444;
           background: url('/assets/img/icons/broken-img.png') no-repeat 0 50% white;
       }

       .proton-embedded:not([src]):not([alt]) {
           background-position-x: 50%;
       }

       .proton-embedded[alt]:not([src])::after {
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           bottom: 0;
           content: " " attr(alt);
           white-space: nowrap;
           overflow: hidden;
           text-overflow: ellipsis;
           padding: 10px 0 0 20px;
           color: rgba(0,0,0,0.5);
           background: url('/assets/img/icons/broken-img.png') no-repeat 0 50% white;
       }

       /* see embedded.scss rules */
       .proton-embedded:not([width]):not([style*="width"]) {
           max-width: 100%;
           min-width: 38px;
       }

       .protonmail_signature_block-empty { display: none }

       .protonmail_quote {
           position: relative;
       }

       li {
           list-style-position: inside;
       }

       // Handle outlook https://github.com/ProtonMail/Angular/issues/6711
       p.MsoNormal, li.MsoNormal, div.MsoNormal {
           margin: 0;
       }
   `;

    style.setAttribute('type', 'text/css');
    style.setAttribute('rel', 'stylesheet');
    style.appendChild(document.createTextNode(css));
    head.appendChild(style);

    (document.childNodes[0] as Element).className = IFRAME_CLASS;
};
