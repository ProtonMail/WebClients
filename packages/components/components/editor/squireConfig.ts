import { Ref, RefObject, MutableRefObject } from 'react';
import { content } from '@proton/shared/lib/sanitize';
import { c } from 'ttag';

export enum FONT_FACE {
    Georgia = 'georgia',
    Arial = 'arial',
    Helvetica = 'helvetica',
    Monospace = 'menlo, consolas, courier new, monospace',
    Tahoma = 'tahoma, sans-serif',
    Verdana = 'verdana',
    'Times New Roman' = 'times new roman',
    'Trebuchet MS' = 'trebuchet ms',
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
    '#7F6124',
];

export const HEADER_CLASS = 'h4';
export const IFRAME_CLASS = 'editor-squire-iframe';

export const DEFAULT_FONT_FACE = FONT_FACE.Arial;
export const DEFAULT_FONT_SIZE = 14;
export const DEFAULT_FONT_COLOR = () => '#222222';
export const DEFAULT_BACKGROUND = () => '#FFFFFF';
export const DEFAULT_LINK = '';
export const DEFAULT_IMAGE = '';

export const RGB_REGEX = /rgb\((\d+)\s*,\s*(\d+),\s*(\d+)\)/;

export const EMBEDDABLE_TYPES = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'];

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
    addEventListener: <E extends Event>(type: string, handler: (event: E) => void) => void;
    removeEventListener: <E extends Event>(type: string, handler: (event: E) => void) => void;
    fireEvent: (type: string, event?: Event) => void;
    getCursorPosition: () => DOMRect;
}

export interface LinkData {
    link: string;
    title: string;
}

export const getSquireRef = (ref: Ref<SquireType>) => (ref as RefObject<SquireType>).current as SquireType;
export const setSquireRef = (ref: Ref<SquireType>, squire: any) => {
    (ref as any as MutableRefObject<any>).current = squire;
};

export const SQUIRE_CONFIG = {
    sanitizeToDOMFragment(html: string, isPaste: boolean, self: any) {
        // eslint-disable-next-line no-underscore-dangle
        const doc = self._doc as Document;
        // Use proton's instance of DOMPurify to allow proton-src attributes to be displayed in squire.
        const frag = html ? content(html) : null;
        return frag ? doc.importNode(frag, true) : doc.createDocumentFragment();
    },
};

/**
 * Custom CSS inside the IFRAME
 */
export const insertCustomStyle = (document: Document) => {
    const head = document.head || document.getElementsByTagName('head')[0];
    const style = document.createElement('style');

    const css = `
        // custom scroll
        body:not(.isDarkMode) {
            --scrollbar-thumb-color: rgba(0, 0, 0, 0.35);
            --scrollbar-thumb-hover-color: rgba(0, 0, 0, 0.5);
        }

        body.isDarkMode {
            --scrollbar-thumb-color: rgba(255, 255, 255, 0.2);
            --scrollbar-thumb-hover-color: rgba(255, 255, 255, 0.5);
        }

        * {
            scrollbar-width: thin;
            scrollbar-color: var(--scrollbar-thumb-color) transparent;
        }
        *::-webkit-scrollbar {
            width: 0.625rem; /* 10px */
            height: 0.625rem;
        }
        *::-webkit-scrollbar-thumb {
            border: .125rem solid transparent; /* 2px */
            background-clip: padding-box;
            border-radius: .3125rem; /* 5px */
            background-color: var(--scrollbar-thumb-color, rgba(0, 0, 0, 0.35) );
        }
        *::-webkit-scrollbar-track {
            background-color: transparent;
        }
        *::-webkit-scrollbar-thumb:horizontal:hover,
        *::-webkit-scrollbar-thumb:vertical:hover {
            background-color: var(--scrollbar-thumb-hover-color, rgba(0, 0, 0, 0.5) );
        }
        *::-webkit-scrollbar-corner {
            visibility: hidden;
        }

        html {
            height: 100%;
            font-size: 100%;
            cursor: text;
        }

        body {
            box-sizing: border-box;
            font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
            font-size: .875rem; /* 14 */
            line-height: 1.65;
            color: #222;
            background: #fff;
            /* to fix, CSS var are not passing through the iframe */
            word-wrap: break-word;
            margin: 0;
        }

        body a {
            color: #657ee4;
        }

        [id="squire"] {
            outline: none;
            padding: 0.5rem;
        }

        [id="ellipsis"] {
            color: inherit;
            border: 1px solid silver;
            background-color: white;
            border-radius: 3px;
            text-decoration: none;
            cursor: pointer;
            font-size: 1.2em;
            padding: 0 .5em;
            margin: 0 0.5rem 0.5rem 0.5rem;
        }

        [id="ellipsis"]:hover,
        [id="ellipsis"]:focus {
            border-color: darkgrey;
            background-color: whitesmoke;
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

const wrapInsertHTML = (squire: any) => {
    const ghost = squire.insertHTML;
    squire.insertHTML = async (html: string, isPaste: boolean) => {
        if (isPaste) {
            try {
                const fragment = SQUIRE_CONFIG.sanitizeToDOMFragment(html, isPaste, squire);
                const { firstElementChild: first, lastElementChild: last } = fragment as any as ParentNode;

                // Check if it is just one image being pasted.
                // If so, block normal insertion because it will be added as embedded image.
                if (first && first === last && first.tagName === 'IMG') {
                    return;
                }
            } catch (e) {
                console.error(e); // eslint-disable-line no-console
            }
        }
        ghost.call(squire, html, isPaste);
    };
};

export const initSquire = async (document: Document, onEllipseClick: () => void): Promise<any> => {
    insertCustomStyle(document);
    const { default: Squire } = await import('squire-rte');

    // Good old HTML management because there is no React or anything inside the iframe
    const title = c('Title').t`Expand content`;
    document.body.innerHTML = `
        <div id="squire"></div>
        <div id="ellipsis-container">
            <button id="ellipsis" title="${title}" style="display: none;">&hellip;</button>
        </div>
    `;
    const squireContainer = document.body.querySelector('#squire');
    const ellipsisContainer = document.querySelector('#ellipsis-container');
    const ellipsisButton = document.querySelector('#ellipsis');

    const squire = new Squire(squireContainer, SQUIRE_CONFIG);
    wrapInsertHTML(squire);

    ellipsisButton?.addEventListener('click', onEllipseClick);
    const fallbackElements = [document.documentElement, document.body, ellipsisContainer];
    document.addEventListener('click', (event) => {
        if (fallbackElements.includes(event.target as Element | null)) {
            // Prevent to deselect an ongoing selection
            if (!document.defaultView?.getSelection()?.toString().length) {
                const lines = document.querySelectorAll('#squire > div:not(.protonmail_signature_block)');
                const lastLine = lines.length > 0 ? lines[lines.length - 1] : undefined;
                const brs = lastLine?.querySelectorAll('br') || [];
                const lastBr = brs?.length > 0 ? brs[brs?.length - 1] : undefined;

                const range = document.createRange();
                if (lastBr) {
                    range.setStartBefore(lastBr);
                } else if (lastLine) {
                    range.selectNode(lastLine);
                    range.collapse(false);
                }
                squire.setSelection(range);
            }

            squire.focus();
        }
    });

    return squire;
};

export const toggleEllipsisButton = (document: Document, show: boolean) => {
    const element = document.body.querySelector('#ellipsis') as HTMLDivElement | undefined;
    if (element?.style?.display) {
        element.style.display = show ? 'block' : 'none';
    }
};
