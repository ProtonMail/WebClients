import { FONT_FACES } from '@proton/components/components/editor/constants';

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
