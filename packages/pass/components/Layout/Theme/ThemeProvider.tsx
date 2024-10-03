import { type FC, useEffect, useLayoutEffect, useState } from 'react';

// @ts-ignore
import passDarkTheme from '@proton/colors/themes/dist/pass-dark.theme.css';
// @ts-ignore
import passLightTheme from '@proton/colors/themes/dist/pass-light.theme.css';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';

export const THEME_ID = 'pass-theme';

type ThemeConfig = {
    className: string;
    styles: string;
};

const matchMediaDark = window.matchMedia('(prefers-color-scheme: dark)');

const PASS_THEMES_MAP: Record<PassThemeOption, ThemeConfig> = {
    [PassThemeOption.PassDark]: {
        className: 'pass-dark',
        styles: passDarkTheme.toString(),
    },
    [PassThemeOption.PassLight]: {
        className: 'pass-light',
        styles: passLightTheme.toString(),
    },
    [PassThemeOption.OS]: {
        className: matchMediaDark.matches ? 'pass-dark' : 'pass-light',
        styles: matchMediaDark.matches ? passDarkTheme.toString() : passLightTheme.toString(),
    },
};

type Props = { theme: PassThemeOption };

export const ThemeProvider: FC<Props> = ({ theme }) => {
    const { getTheme, setTheme } = usePassCore();
    const [config, setConfig] = useState<ThemeConfig>(PASS_THEMES_MAP[theme]);

    useEffect(() => {
        setConfig(PASS_THEMES_MAP[theme]);
    }, [theme]);

    useEffect(() => {
        // Get initial theme stored locally
        (async () => (await getTheme?.()) ?? PASS_DEFAULT_THEME)()
            .then(setTheme)
            .catch(() => setTheme?.(PASS_DEFAULT_THEME));
    }, []);

    useLayoutEffect(() => {
        document.body.classList.add(config.className);
        return () => document.body.classList.remove(config.className);
    }, [config]);

    useLayoutEffect(() => {
        if (theme === PassThemeOption.OS) {
            const listener = (e: MediaQueryListEvent) => {
                setConfig(PASS_THEMES_MAP[e.matches ? PassThemeOption.PassDark : PassThemeOption.PassLight]);
            };
            matchMediaDark.addEventListener?.('change', listener);
            return () => {
                matchMediaDark.removeEventListener?.('change', listener);
            };
        }
    }, [theme]);

    return <>{config && <style id={THEME_ID}>{config.styles}</style>}</>;
};
