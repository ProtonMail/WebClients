import { DARK_MODE_CLASS } from '../constants';

/**
 * Given a theme, return true if it corresponds to dark mode, false otherwise
 */
export const isDarkTheme = () => {
    return document.body.classList.contains(DARK_MODE_CLASS);
};

/**
 * Given two arguments, the second meant to be used in dark mode and the first in the other cases,
 * pick the appropiate one depending on whether the class 'isDarkMode' is in the body or not
 */
export const getLightOrDark = <A, B>(light: A, dark: B) => {
    return isDarkTheme() ? dark : light;
};
