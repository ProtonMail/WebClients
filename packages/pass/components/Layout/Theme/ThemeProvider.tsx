import type { FC } from 'react';

// @ts-ignore
import theme from '@proton/colors/themes/dist/pass-dark.theme.css';

export const THEME_ID = 'theme-root';

export const ThemeProvider: FC = () => {
    return <style id={THEME_ID}>{theme.toString()}</style>;
};
