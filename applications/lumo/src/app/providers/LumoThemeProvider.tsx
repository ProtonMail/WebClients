import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useLayoutEffect } from 'react';

import { ThemeTypes } from '@proton/theme/constants';

import { applyLumoTheme } from './lumoThemeDom';
import { getLumoDefaultTheme } from './lumoThemeUtils';
import { useLumoThemeLogic } from './useLumoThemeLogic';

export { ThemeTypes };

export interface LumoThemeContextType {
    theme: ThemeTypes;
    setTheme: (theme: ThemeTypes) => void;
    setAutoTheme: (enabled: boolean) => void;
    isDarkLumoTheme: boolean;
    isAutoMode: boolean;
}

const LumoThemeContext = createContext<LumoThemeContextType>({
    theme: getLumoDefaultTheme(),
    setTheme: () => {},
    setAutoTheme: () => {},
    isDarkLumoTheme: false,
    isAutoMode: false,
});

export const LumoThemeProvider: FC<PropsWithChildren> = ({ children }) => {
    const { theme, setTheme, setAutoTheme, isDarkLumoTheme, isAutoMode } = useLumoThemeLogic();

    // Updates the theme <style> created in index.tsx instead of rendering one, so nothing is removed
    // when this provider unmounts or the app tree is swapped.
    useLayoutEffect(() => {
        applyLumoTheme(theme);
    }, [theme]);

    return (
        <LumoThemeContext.Provider value={{ theme, setTheme, setAutoTheme, isDarkLumoTheme, isAutoMode }}>
            {children}
        </LumoThemeContext.Provider>
    );
};

export const useLumoTheme = () => useContext(LumoThemeContext);
