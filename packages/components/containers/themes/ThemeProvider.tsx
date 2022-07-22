import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import { PROTON_DEFAULT_THEME, PROTON_THEMES_MAP, ThemeTypes } from '@proton/shared/lib/themes/themes';
import noop from '@proton/utils/noop';

export const THEME_ID = 'theme-root';

export const ThemeContext = createContext<[ThemeTypes, (theme: ThemeTypes) => void]>([PROTON_DEFAULT_THEME, noop]);

interface Props {
    children: ReactNode;
    initial?: ThemeTypes;
}

export const getThemeStyle = (themeType: ThemeTypes = PROTON_DEFAULT_THEME) => {
    return PROTON_THEMES_MAP[themeType]?.theme || PROTON_THEMES_MAP[PROTON_DEFAULT_THEME].theme;
};

export const useTheme = () => {
    return useContext(ThemeContext);
};

const THEME_COOKIE_NAME = 'Theme';

const storedTheme = getCookie(THEME_COOKIE_NAME);

const ThemeProvider = ({ children, initial }: Props) => {
    const [theme, setThemeBase] = useState<ThemeTypes>(() => {
        if (initial !== undefined) {
            return initial;
        }

        if (storedTheme) {
            return Number(storedTheme);
        }

        return PROTON_DEFAULT_THEME;
    });

    useEffect(() => {
        setCookie({
            cookieName: THEME_COOKIE_NAME,
            cookieValue: String(theme),
            cookieDomain: getSecondLevelDomain(window.location.hostname),
            path: '/',
            expirationDate: 'max',
        });

        const themeMeta = document.querySelector("meta[name='theme-color']");
        const uiProminentElement = document.querySelector('.ui-prominent');
        const themeColor = uiProminentElement
            ? window.getComputedStyle(uiProminentElement).getPropertyValue('--background-norm').trim()
            : '';

        if (themeMeta && themeColor) {
            themeMeta.setAttribute('content', themeColor);
        }
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
