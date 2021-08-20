import { RIGHT_TO_LEFT } from '@proton/shared/lib/constants';

export enum ALIGNMENT {
    Left = 'left',
    Center = 'center',
    Justify = 'justify',
    Right = 'right',
}

export interface SquireEditorMetadata {
    supportImages: boolean;
    supportPlainText: boolean;
    isPlainText: boolean;
    supportRightToLeft: boolean;
    rightToLeft: RIGHT_TO_LEFT;
}

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
    insertHTML: (html: string) => void;
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

export interface FontData {
    FontFace?: string;
    FontSize?: number;
}
