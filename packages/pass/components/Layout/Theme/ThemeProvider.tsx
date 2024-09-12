import { type FC, type PropsWithChildren, useLayoutEffect } from 'react';

// @ts-ignore
import passDarkTheme from '@proton/colors/themes/dist/pass-dark.theme.css';
// @ts-ignore
import passLightTheme from '@proton/colors/themes/dist/pass-light.theme.css';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';

export const THEME_ID = 'pass-theme';
type Props = { theme: ThemeTypes };

type PassTheme = {
    className: string;
    styles: string;
};

export const PASS_THEMES_MAP: Partial<Record<ThemeTypes, PassTheme>> = {
    [ThemeTypes.PassDark]: {
        className: 'pass-dark',
        styles: passDarkTheme.toString(),
    },
    [ThemeTypes.PassLight]: {
        className: 'pass-light',
        styles: passLightTheme.toString(),
    },
};

export const ThemeProvider: FC<PropsWithChildren<Props>> = ({ theme, children }) => {
    const { className, styles } = PASS_THEMES_MAP[theme] ?? PASS_THEMES_MAP[ThemeTypes.PassDark]!;

    useLayoutEffect(() => {
        document.body.classList.add(className);
        return () => document.body.classList.remove(className);
    }, [className]);

    return (
        <>
            <style id={THEME_ID}>{styles}</style>
            {children}
        </>
    );
};
