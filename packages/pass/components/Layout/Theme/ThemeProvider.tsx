import type { PropsWithChildren } from 'react';
import { type FC, createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';

// @ts-ignore
import passDarkTheme from '@proton/colors/themes/dist/pass-dark.theme.css';
// @ts-ignore
import passLightTheme from '@proton/colors/themes/dist/pass-light.theme.css';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { matchDarkTheme } from '@proton/pass/components/Layout/Theme/utils';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
import noop from '@proton/utils/noop';

export const THEME_ID = 'pass-theme';

type ThemeConfig = { className: string; styles: string };

const getThemeConfig = (theme: PassThemeOption): ThemeConfig => {
    switch (theme) {
        case PassThemeOption.PassDark:
            return { className: 'pass-dark', styles: passDarkTheme.toString() };
        case PassThemeOption.PassLight:
            return { className: 'pass-light', styles: passLightTheme.toString() };
        case PassThemeOption.OS:
            return getThemeConfig(matchDarkTheme().matches ? PassThemeOption.PassDark : PassThemeOption.PassLight);
    }
};

export const PassThemeContext = createContext<PassThemeOption>(PASS_DEFAULT_THEME);

export const PassThemeProvider: FC<PropsWithChildren> = ({ children }) => {
    const core = usePassCore();
    const [theme, setTheme] = useState<PassThemeOption>(core.theme.getState());
    const [config, setConfig] = useState<ThemeConfig>(getThemeConfig(theme));

    useEffect(() => {
        const unsubcribe = core.theme.subscribe(setTheme);

        core.theme
            .getInitialTheme?.()
            .then((initial) => core.theme.setState(initial ?? PASS_DEFAULT_THEME))
            .catch(noop);

        return unsubcribe;
    }, []);

    useLayoutEffect(() => {
        setConfig(getThemeConfig(theme));

        /** Match media events don't propagate well to iframes */
        if (theme === PassThemeOption.OS && window.self === window.top) {
            const media = matchDarkTheme();
            const listener = () => setConfig(getThemeConfig(theme));
            media?.addEventListener('change', listener);
            return () => media?.removeEventListener('change', listener);
        }
    }, [theme]);

    useLayoutEffect(() => {
        document.body.classList.add(config.className);
        return () => document.body.classList.remove(config.className);
    }, [config]);

    return (
        <PassThemeContext.Provider value={theme}>
            <style id={THEME_ID}>{config.styles}</style>
            {children}
        </PassThemeContext.Provider>
    );
};

export const usePassTheme = () => useContext(PassThemeContext);
