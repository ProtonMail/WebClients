import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE } from './constants';

export interface FontData {
    FontFace: string | null;
    FontSize: number | null;
}

/**
 * Helper used because of Squire problems to handle correctly default fonts
 * TODO : Remove patches arround this issue
 */
export const defaultFontStyle = (fontData: FontData | undefined): string => {
    let { FontFace, FontSize } = fontData || {};
    FontFace = !FontFace ? DEFAULT_FONT_FACE : FontFace;
    FontSize = !FontSize ? DEFAULT_FONT_SIZE : FontSize;
    const stylesArray = [`font-family: ${FontFace};`, `font-size: ${FontSize}px;`];

    return stylesArray.join(' ');
};
