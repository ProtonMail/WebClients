import { type FC, useLayoutEffect, useState } from 'react';

// @ts-ignore
import passDarkTheme from '@proton/colors/themes/dist/pass-dark.theme.css';
// @ts-ignore
import passLightTheme from '@proton/colors/themes/dist/pass-light.theme.css';
import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { matchDarkTheme } from '@proton/pass/components/Layout/Theme/utils';

export const THEME_ID = 'pass-theme';

type ThemeConfig = {
    className: string;
    styles: string;
};

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

type Props = { theme: PassThemeOption };

export const ThemeProvider: FC<Props> = ({ theme }) => {
    const [config, setConfig] = useState<ThemeConfig>(getThemeConfig(theme));

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

    return <style id={THEME_ID}>{config.styles}</style>;
};
