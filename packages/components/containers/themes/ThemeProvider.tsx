import React, { createContext, useContext, useState } from 'react';
import { PROTON_THEMES, ThemeTypes } from '@proton/shared/lib/themes/themes';
import { noop } from '@proton/shared/lib/helpers/function';
import { APPS } from '@proton/shared/lib/constants';

import { useConfig } from '../../hooks';

export const THEME_ID = 'theme-root';

export const ThemeContext = createContext<[ThemeTypes, React.Dispatch<React.SetStateAction<ThemeTypes>>]>([
    ThemeTypes.Default,
    noop,
]);

interface Props {
    children: React.ReactNode;
}

export const getThemeStyle = (themeType: ThemeTypes = ThemeTypes.Default) => {
    return PROTON_THEMES[themeType]?.theme || PROTON_THEMES[ThemeTypes.Default].theme;
};

export const useTheme = () => {
    return useContext(ThemeContext);
};

const ThemeProvider = ({ children }: Props) => {
    const { APP_NAME } = useConfig();

    const [theme, setTheme] = useState<ThemeTypes>(ThemeTypes.Default);

    const computedTheme = Object.values(ThemeTypes).includes(theme) ? theme : ThemeTypes.Default;

    const style = getThemeStyle(APP_NAME === APPS.PROTONVPN_SETTINGS ? ThemeTypes.Default : computedTheme);

    return (
        <ThemeContext.Provider value={[computedTheme, setTheme]}>
            <style id={THEME_ID}>{style}</style>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
