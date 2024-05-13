// @ts-ignore
import theme from '@proton/colors/themes/dist/wallet.theme.css';

export const THEME_ID = 'theme-root';

export const ThemeProvider = () => {
    return <style id={THEME_ID}>{theme.toString()}</style>;
};
