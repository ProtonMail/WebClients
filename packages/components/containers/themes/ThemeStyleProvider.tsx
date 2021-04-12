import React, { createContext, useContext, useState } from 'react';
import { PROTON_THEMES } from 'proton-shared/lib/themes/themes';
import { noop } from 'proton-shared/lib/helpers/function';
import { APPS } from 'proton-shared/lib/constants';

import { useConfig } from '../../hooks';

export const THEME_ID = 'theme-root';

export const Context = createContext([noop, PROTON_THEMES.DEFAULT.theme]);

interface Props {
    children: React.ReactNode;
}

export const useThemeStyle = () => {
    return useContext(Context);
};

const ThemeStyleProvider = ({ children }: Props) => {
    const { APP_NAME } = useConfig();
    const state = useState<string>(() => PROTON_THEMES.DEFAULT.theme);
    const [style] = state;

    const computedStyle = APP_NAME === APPS.PROTONVPN_SETTINGS ? PROTON_THEMES.DEFAULT.theme : style;

    return (
        <Context.Provider value={state}>
            <style id={THEME_ID}>{computedStyle}</style>
            {children}
        </Context.Provider>
    );
};

export default ThemeStyleProvider;
