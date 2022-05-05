import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { PROTON_DEFAULT_THEME, PROTON_THEMES_MAP, ThemeTypes } from '@proton/shared/lib/themes/themes';
import { noop } from '@proton/shared/lib/helpers/function';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';

export const THEME_ID = 'theme-root';

export const ThemeContext = createContext<[ThemeTypes, (theme: ThemeTypes) => void]>([PROTON_DEFAULT_THEME, noop]);

interface Props {
    children: ReactNode;
}

export const getThemeStyle = (themeType: ThemeTypes = PROTON_DEFAULT_THEME) => {
    return PROTON_THEMES_MAP[themeType]?.theme || PROTON_THEMES_MAP[PROTON_DEFAULT_THEME].theme;
};

export const useTheme = () => {
    return useContext(ThemeContext);
};

const THEME_COOKIE_NAME = 'Theme';

const storedTheme = getCookie(THEME_COOKIE_NAME);

const ThemeProvider = ({ children }: Props) => {
    const [theme, setThemeBase] = useState<ThemeTypes>(storedTheme ? Number(storedTheme) : PROTON_DEFAULT_THEME);

    useEffect(() => {
        setCookie({
            cookieName: THEME_COOKIE_NAME,
            cookieValue: String(theme),
            cookieDomain: getSecondLevelDomain(window.location.hostname),
            path: '/',
            expirationDate: 'max',
        });
    }, [theme]);

    const setTheme = (nextTheme: ThemeTypes) => {
        setThemeBase(Object.values(ThemeTypes).includes(nextTheme) ? nextTheme : PROTON_DEFAULT_THEME);
    };

    const style = getThemeStyle(theme);

    return (
        <ThemeContext.Provider value={[theme, setTheme]}>
            <style id={THEME_ID}>{style}</style>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeProvider;
