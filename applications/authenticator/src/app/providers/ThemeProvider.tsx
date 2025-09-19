import { type FC, type ReactNode, useEffect, useLayoutEffect, useState } from 'react';

import app from 'proton-authenticator/lib/app';
import { useAppSelector } from 'proton-authenticator/store/utils';

// @ts-ignore
import passDarkTheme from '@proton/colors/themes/dist/authenticator-dark.theme.css';
// @ts-ignore
import passLightTheme from '@proton/colors/themes/dist/authenticator-light.theme.css';

const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
type ColorScheme = 'dark' | 'light';

const themes: Record<ColorScheme, string> = {
    dark: passDarkTheme,
    light: passLightTheme,
};

export const ThemeProvider: FC<{ children: ReactNode | ReactNode[] }> = ({ children }) => {
    const { theme } = useAppSelector((s) => s.settings);
    const [colorScheme, setColorScheme] = useState<ColorScheme>(matchMedia.matches ? 'dark' : 'light');
    const styles = colorScheme ? themes[colorScheme].toString() : '';

    // Every time the `theme` setting is changed, propagate it back to Tauri.
    // This will cause a matchMedia change event that is ultimately responsible
    // for deciding what color scheme/styles are applied.
    //
    // For example, the "automatic" theme can use either of the styles. This
    // depends on OS settings, and its why there is a distinction between
    // the app's theme (expressed user preference) and its color scheme
    // (what actually ends up being displayed on screen).
    useEffect(() => {
        void app.setTheme(theme);
    }, [theme]);

    useEffect(() => {
        const onWindowSchemeChange = (event: MediaQueryListEvent) => {
            const newColorScheme = event.matches ? 'dark' : 'light';
            setColorScheme(newColorScheme);
        };

        matchMedia.addEventListener('change', onWindowSchemeChange);
        return () => matchMedia.removeEventListener('change', onWindowSchemeChange);
    }, []);

    useLayoutEffect(() => {
        if (colorScheme) {
            document.body.classList.add(colorScheme);
            return () => document.body.classList.remove(colorScheme);
        }
    }, [colorScheme]);

    return (
        <>
            <style id="theme-root">{styles}</style>
            {colorScheme && children}
        </>
    );
};
