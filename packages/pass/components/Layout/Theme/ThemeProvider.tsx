import type { FC17 } from 'react';

// @ts-ignore
import theme from '@proton/colors/themes/dist/pass.theme.css';

export const THEME_ID = 'theme-root';

export const ThemeProvider: FC17 = () => {
    return <style id={THEME_ID}>{theme.toString()}</style>;
};
