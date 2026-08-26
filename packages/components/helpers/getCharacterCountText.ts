import { c } from 'ttag';

/**
 * Assistive text showing how many characters have been typed out of the allowed maximum.
 * Shared so every usage extracts to a single translation.
 */
export const getCharacterCountText = (length: number, maxLength: number) => {
    // translator: character count hint showing the current length and the maximum allowed length. Example: '25/191 characters'
    return c('Label').t`${length}/${maxLength} characters`;
};
