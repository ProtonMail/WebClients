import { DARK_MODE_CLASS } from '../constants';

/**
 * Given a theme, return true if it corresponds to dark mode, false otherwise
 */
export const isDarkTheme = () => {
    return document.body.classList.contains(DARK_MODE_CLASS);
};
