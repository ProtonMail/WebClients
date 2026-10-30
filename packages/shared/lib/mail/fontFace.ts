type FontFace =
    | 'SANS_SERIF'
    | 'SERIF'
    | 'GEORGIA'
    | 'ARIAL'
    | 'HELVETICA'
    | 'MONOSPACE'
    | 'TAHOMA'
    | 'VERDANA'
    | 'TIMES_NEW_ROMAN'
    | 'TREBUCHET_MS';

/**
 * Used in composer font selector
 */
export const FONT_FACES: Record<FontFace, { id: string; label: string; value: string }> = {
    SANS_SERIF: {
        id: 'Sans-serif',
        label: 'Sans Serif',
        value: 'sans-serif',
    },
    SERIF: {
        id: 'Serif',
        label: 'Serif',
        value: 'serif',
    },
    GEORGIA: {
        id: 'Georgia',
        label: 'Georgia',
        value: 'Georgia, serif',
    },
    ARIAL: {
        id: 'Arial',
        label: 'Arial',
        value: 'Arial, sans-serif',
    },
    HELVETICA: {
        id: 'Helvetica',
        label: 'Helvetica',
        value: 'Helvetica, sans-serif',
    },
    MONOSPACE: {
        id: 'Menlo, Consolas, Courier New, Monospace',
        label: 'Monospace',
        value: 'Menlo, Consolas, Courier New, Monospace',
    },
    TAHOMA: {
        id: 'Tahoma, sans-serif',
        label: 'Tahoma',
        value: 'Tahoma, sans-serif',
    },
    VERDANA: {
        id: 'Verdana',
        label: 'Verdana',
        value: 'Verdana, sans-serif',
    },
    TIMES_NEW_ROMAN: {
        id: 'Times New Roman',
        label: 'Times New Roman',
        value: 'Times New Roman, serif',
    },
    TREBUCHET_MS: {
        id: 'Trebuchet MS',
        label: 'Trebuchet MS',
        value: 'Trebuchet MS, sans-serif',
    },
};

export const DEFAULT_FONT_FACE = FONT_FACES.ARIAL.value;
export const DEFAULT_FONT_FACE_ID = FONT_FACES.ARIAL.id;

export const DEFAULT_FONT_SIZE = 14;

/**
 * getFontFaceValueFromId
 * @param fontFaceId font face id saved in user settings
 * @returns font face value to display in editor
 */
export const getFontFaceValueFromId = (fontFaceId: string | null | undefined): string | undefined =>
    Object.values(FONT_FACES).find((font) => font.id === fontFaceId)?.value;

/**
 * getFontFaceIdFromValue
 * @param fontFaceValue font face value front FONT_FACE constant
 * @returns font face id to save in user settings
 */
export const getFontFaceIdFromValue = (fontFaceValue: string): string | undefined =>
    Object.values(FONT_FACES).find((font) => font.value === fontFaceValue)?.id;

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
