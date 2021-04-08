import React, { createContext, useContext, useLayoutEffect, useState } from 'react';
import { PROTON_THEMES } from 'proton-shared/lib/themes/themes';
import { noop } from 'proton-shared/lib/helpers/function';
import { DARK_MODE_CLASS } from 'proton-shared/lib/constants';
import tinycolor from 'tinycolor2';

export const THEME_ID = 'theme-root';

export const Context = createContext([noop, PROTON_THEMES.DEFAULT.theme]);

interface Props {
    children: React.ReactNode;
}

export const useThemeStyle = () => {
    return useContext(Context);
};

const ThemeStyleProvider = ({ children }: Props) => {
    const state = useState<string>(() => PROTON_THEMES.DEFAULT.theme);

    const [style] = state;

    useLayoutEffect(() => {
        // This matches the first background-norm from ui-standard
        const [, backgroundNorm] = style.match(/--background-norm: (.[^;]+)/) || [];
        const clear = () => {
            document.body.classList.remove(DARK_MODE_CLASS);
        };
        if (!backgroundNorm) {
            clear();
            return;
        }
        const colorModel = tinycolor(backgroundNorm) as any;
        if (!colorModel) {
            clear();
            return;
        }
        if (colorModel.isDark()) {
            document.body.classList.add(DARK_MODE_CLASS);
            return clear;
        }
        clear();
    }, [style]);

    return (
        <Context.Provider value={state}>
            <style id={THEME_ID}>{style}</style>
            {children}
        </Context.Provider>
    );
};

export default ThemeStyleProvider;
