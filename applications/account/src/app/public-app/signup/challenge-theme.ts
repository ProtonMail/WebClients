import { THEME_ID } from '@proton/theme/ThemeProvider';

export const getThemeData = () => {
    return document.querySelector(`#${THEME_ID}`)?.innerHTML;
};
