import { THEME_ID } from '@proton/components/containers/themes/ThemeProvider';

export const getThemeData = () => {
    return document.querySelector(`#${THEME_ID}`)?.innerHTML;
};
