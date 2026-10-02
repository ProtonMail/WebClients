import { type FC, type PropsWithChildren, createContext, useContext } from 'react';

import { ThemeTypes } from '@proton/shared/lib/themes/constants';

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
    const { theme, setTheme, setAutoTheme, isDarkLumoTheme, isAutoMode, config } = useLumoThemeLogic();

    return (
        <LumoThemeContext.Provider value={{ theme, setTheme, setAutoTheme, isDarkLumoTheme, isAutoMode }}>
            <style id={isDarkLumoTheme ? 'lumo-dark-theme' : 'lumo-light-theme'}>{config.styles}</style>
            {children}
        </LumoThemeContext.Provider>
    );
};

export const useLumoTheme = () => useContext(LumoThemeContext);
