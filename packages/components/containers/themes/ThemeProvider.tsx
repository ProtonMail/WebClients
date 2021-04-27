import React, { createContext, useContext, useState } from 'react';
import { PROTON_THEMES, ThemeTypes } from 'proton-shared/lib/themes/themes';
import { noop } from 'proton-shared/lib/helpers/function';
import { APPS } from 'proton-shared/lib/constants';

import { useConfig } from '../../hooks';

export const THEME_ID = 'theme-root';

export const ThemeContext = createContext([noop, PROTON_THEMES.DEFAULT.theme]);

interface Props {
    children: React.ReactNode;
}

export const getThemeStyle = (themeType: ThemeTypes = ThemeTypes.Default) => {
    const themeStyle = {
        [ThemeTypes.Default]: PROTON_THEMES.DEFAULT.theme,
        [ThemeTypes.Dark]: PROTON_THEMES.DARK.theme,
        [ThemeTypes.Light]: PROTON_THEMES.LIGHT.theme,
        [ThemeTypes.Monokai]: PROTON_THEMES.MONOKAI.theme,
        [ThemeTypes.Contrast]: PROTON_THEMES.CONTRAST.theme,
    }[themeType];
    return themeStyle || PROTON_THEMES.DEFAULT.theme;
};

export const useTheme = () => {
    return useContext(ThemeContext);
};

const ThemeProvider = ({ children }: Props) => {
    const { APP_NAME } = useConfig();

    const [theme, setTheme] = useState<ThemeTypes>(PROTON_THEMES.DEFAULT.theme);

    const style = getThemeStyle(APP_NAME === APPS.PROTONVPN_SETTINGS ? PROTON_THEMES.DEFAULT.theme : theme);

    return (
        <ThemeContext.Provider value={[theme, setTheme]}>
            <style id={THEME_ID}>{style}</style>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
