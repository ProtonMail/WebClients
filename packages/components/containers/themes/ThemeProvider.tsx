import { createContext, useContext, useState } from 'react';
import * as React from 'react';
import { HistoricThemeTypes, PROTON_THEMES_MAP, ThemeMigrationMap, ThemeTypes } from '@proton/shared/lib/themes/themes';
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
    return PROTON_THEMES_MAP[themeType]?.theme || PROTON_THEMES_MAP[ThemeTypes.Default].theme;
};

export const useTheme = () => {
    return useContext(ThemeContext);
};

const getThemeMigration = (theme: ThemeTypes | HistoricThemeTypes): ThemeTypes | undefined => {
    if (!(theme in HistoricThemeTypes)) {
        return theme as ThemeTypes;
    }

    const migration = ThemeMigrationMap[theme as HistoricThemeTypes];

    if (migration === undefined) {
        return;
    }

    return getThemeMigration(migration);
};

const ThemeProvider = ({ children }: Props) => {
    const { APP_NAME } = useConfig();

    const [theme, setTheme] = useState<ThemeTypes>(ThemeTypes.Default);

    let computedTheme = getThemeMigration(theme) || ThemeTypes.Default;

    if (!Object.values(ThemeTypes).includes(computedTheme)) {
        computedTheme = ThemeTypes.Default;
    }

    const style = getThemeStyle(APP_NAME === APPS.PROTONVPN_SETTINGS ? ThemeTypes.Default : computedTheme);

    return (
        <ThemeContext.Provider value={[computedTheme, setTheme]}>
            <style id={THEME_ID}>{style}</style>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
