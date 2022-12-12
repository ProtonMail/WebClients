import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE } from './constants';
import { getFontFaceValueFromId } from './helpers/fontFace';

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
    FontFace = !FontFace ? DEFAULT_FONT_FACE : getFontFaceValueFromId(FontFace) || DEFAULT_FONT_FACE;
    FontSize = !FontSize ? DEFAULT_FONT_SIZE : FontSize;
    const stylesArray = [`font-family: ${FontFace};`, `font-size: ${FontSize}px;`];

    return stylesArray.join(' ');
};
