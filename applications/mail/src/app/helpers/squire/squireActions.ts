import { RIGHT_TO_LEFT } from 'proton-shared/lib/constants';

import { getElement } from '../dom';
import {
    SquireType,
    LinkData,
    DEFAULT_LINK,
    DEFAULT_BACKGROUND,
    RGB_REGEX,
    FONT_FACE,
    DEFAULT_FONT_COLOR,
    DEFAULT_FONT_FACE,
    DEFAULT_FONT_SIZE,
    FONT_SIZES
} from './squireConfig';
import { isEmbeddable } from '../embedded/embeddeds';

const testPresenceInSelection = (squire: SquireType, format: string, validation: RegExp) =>
    validation.test(squire.getPath()) || squire.hasFormat(format);

const toggleFormat = (tag: string, test: RegExp, addAction: string, removeAction: string) => (squire: SquireType) => {
    if (testPresenceInSelection(squire, tag, test)) {
        (squire as any)[removeAction]();
    } else {
        (squire as any)[addAction]();
    }
};

const toggleList = (typeIsOrdered: boolean) => (squire: SquireType) => {
    const testOrdered = testPresenceInSelection(squire, 'OL', />OL\b/);
    const testUnordered = testPresenceInSelection(squire, 'UL', />UL\b/);
    const action = typeIsOrdered ? 'makeOrderedList' : 'makeUnorderedList';

    if ((!testOrdered && !testUnordered) || (typeIsOrdered && testUnordered) || (!typeIsOrdered && testOrdered)) {
        squire[action]();
    } else {
        squire.removeList();
    }
};

/**
 * Get the image from the current selection.
 */
const getSelectedImg = (squire: SquireType) => {
    const range = squire.getSelection();
    const ancestor = getElement(range.commonAncestorContainer);
    return ancestor?.querySelector('img');
};

const decimalToHex = (decimal: string) => parseInt(decimal, 10).toString(16);

const rgbToHex = (rgb = '', defaultValue: string) => {
    const result = RGB_REGEX.exec(rgb);
    if (!result || result.length < 4) {
        return defaultValue;
    }
    return `#${decimalToHex(result[1])}${decimalToHex(result[2])}${decimalToHex(result[3])}`;
};

/**
 * Run the callback at any cursor change in Squire
 * Returns an unsubscribe functions meant to be the return value of a useEffect
 */
export const listenToCursor = (squire: SquireType | undefined, callback: () => void) => {
    if (!squire) {
        return;
    }

    squire.addEventListener('click', callback);
    squire.addEventListener('keyup', callback);
    callback();

    return () => {
        squire.removeEventListener('click', callback);
        squire.removeEventListener('keyup', callback);
    };
};

export const toggleBold = toggleFormat('b', />B\b/, 'bold', 'removeBold');
export const toggleItalic = toggleFormat('i', />I\b/, 'italic', 'removeItalic');
export const toggleUnderline = toggleFormat('u', />U\b/, 'underline', 'removeUnderline');
export const toggleOrderedList = toggleList(true);
export const toggleUnorderedList = toggleList(false);
export const toggleBlockquote = toggleFormat('blockquote', />BLOCKQUOTE\b/, 'increaseQuoteLevel', 'decreaseQuoteLevel');

export const getFontLabel = (font: FONT_FACE) => Object.entries(FONT_FACE).find(([, value]) => value === font)?.[0];

export const getFontFaceAtCursor = (squire: SquireType) => {
    const { family = 'arial' } = squire.getFontInfo();
    const first = family.split(',')[0].trim();
    return Object.entries(FONT_FACE).find(([, value]) => value.includes(first))?.[1] || DEFAULT_FONT_FACE;
};

export const getFontSizeAtCursor = (squire: SquireType) => {
    const { size = `${DEFAULT_FONT_SIZE}px` } = squire.getFontInfo();
    const stringValue = /(\d+)px/.exec(size)?.[1];
    const value = Number(stringValue);
    if (!value) {
        return 14;
    }
    return FONT_SIZES.reduce(
        (acc, currentValue) => (Math.abs(value - currentValue) < Math.abs(value - acc) ? currentValue : acc),
        FONT_SIZES[0]
    );
};

/**
 * Get font and background color of the selection
 */
export const getColorsAtCursor = (squire: SquireType) => {
    const { color, backgroundColor } = squire.getFontInfo();
    return { font: rgbToHex(color, DEFAULT_FONT_COLOR), bg: rgbToHex(backgroundColor, DEFAULT_BACKGROUND) };
};

/**
 * Get the current link at the cursor or the current selected item
 */
export const getLinkAtCursor = (squire: SquireType): LinkData => {
    const range = squire.getSelection();
    const ancestor = getElement(range.commonAncestorContainer);
    const a = ancestor?.closest('a');

    return {
        link: a?.href || DEFAULT_LINK,
        title: a?.textContent || range.toString() || DEFAULT_LINK
    };
};

/**
 * Create a link inside the editor
 */
export const makeLink = (squire: SquireType, { link = '', title }: LinkData) => {
    const image = getSelectedImg(squire);

    const a = getElement(squire.getSelection().commonAncestorContainer)?.closest('a');
    const range = squire.getDocument().createRange();
    const selection = squire.getDocument().getSelection();

    // Click inside a word select the whole word
    if (a) {
        range.selectNodeContents(a);
        selection?.removeAllRanges();
        selection?.addRange(range);
        // Set the range on the editor so that an update won't insert a link twice.
        squire.setSelection(range);
    }

    squire.makeLink(link, {
        target: '_blank',
        title: link,
        rel: 'nofollow'
    });

    // Ex we select an image to create a link, we don't want a default textContent (will erase the image)
    if (!image) {
        const ancestor = getElement(squire.getSelection().commonAncestorContainer);
        const linkElement = ancestor?.closest('a') || ancestor?.querySelector('a');
        if (linkElement) {
            linkElement.textContent = title || link;
        }
    }
};

/**
 * Insert an image inside the editor
 */
export const insertImage = (
    squire: SquireType,
    url: string,
    inputAttributes: { [key: string]: string | undefined } = {}
) => {
    const attributes = {
        ...inputAttributes,
        class: (inputAttributes.class ? inputAttributes.class + ' ' : '') + 'proton-embedded'
    };

    squire.focus();
    squire.insertImage(url, attributes);
};

const rightToLeftToString = (rtl: RIGHT_TO_LEFT) => {
    switch (rtl) {
        case RIGHT_TO_LEFT.ON:
            return 'rtl';
        case RIGHT_TO_LEFT.OFF:
            return 'ltr';
    }
};

export const setTextDirection = (squire: SquireType, direction: RIGHT_TO_LEFT) => {
    squire.setTextDirection(rightToLeftToString(direction));
};

/**
 * The default text direction function sets focus to the editor, which breaks the
 * custom focus used by the composer when setting the default text direction to be RTL
 */
export const setTextDirectionWithoutFocus = (squire: SquireType, direction: RIGHT_TO_LEFT) => {
    squire.forEachBlock((block) => {
        if (direction) {
            block.setAttribute('dir', rightToLeftToString(direction));
        } else {
            block.removeAttribute('dir');
        }
    }, true);
};

/**
 * Handler for squire paste event
 * Deals with pasting images
 */
export const pasteFileHandler = (onAddEmbeddedImages: (files: File[]) => void) => (event: ClipboardEvent) => {
    const clipboardData = event.clipboardData;
    // Edge needs items as files is undefined
    const files = Array.from(clipboardData?.files || ((clipboardData?.items as any) as FileList) || []);

    const embeddable = files.every((file) => isEmbeddable(file.type));

    if (embeddable) {
        onAddEmbeddedImages(files);
    }
};
