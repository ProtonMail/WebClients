import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react';
import { HistoricThemeTypes, PROTON_THEMES_MAP, ThemeMigrationMap, ThemeTypes } from '@proton/shared/lib/themes/themes';
import { noop } from '@proton/shared/lib/helpers/function';
import { APPS } from '@proton/shared/lib/constants';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';

import { useConfig } from '../../hooks';

export const THEME_ID = 'theme-root';

export const ThemeContext = createContext<[ThemeTypes, Dispatch<SetStateAction<ThemeTypes>>]>([
    ThemeTypes.Default,
    noop,
]);

interface Props {
    children: ReactNode;
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

const THEME_COOKIE_NAME = 'Theme';

const storedTheme = getCookie(THEME_COOKIE_NAME);

const ThemeProvider = ({ children }: Props) => {
    const { APP_NAME } = useConfig();

    const [theme, setTheme] = useState<ThemeTypes>(storedTheme ? Number(storedTheme) : ThemeTypes.Default);

    useEffect(() => {
        setCookie({
            cookieName: THEME_COOKIE_NAME,
            cookieValue: String(theme),
            cookieDomain: getSecondLevelDomain(window.location.hostname),
            path: '/',
            expirationDate: 'max',
        });
    }, [theme]);

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
