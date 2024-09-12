import { type FC, type PropsWithChildren, useEffect, useLayoutEffect, useState } from 'react';

// @ts-ignore
import passDarkTheme from '@proton/colors/themes/dist/pass-dark.theme.css';
// @ts-ignore
import passLightTheme from '@proton/colors/themes/dist/pass-light.theme.css';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { Maybe } from '@proton/pass/types';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';

export const THEME_ID = 'pass-theme';
type Props = { theme?: ThemeTypes };

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

export const ThemeProvider: FC<PropsWithChildren<Props>> = (props) => {
    const { getInitialTheme } = usePassCore();
    const [theme, setTheme] = useState<Maybe<ThemeTypes>>(props.theme);

    const config = theme ? PASS_THEMES_MAP[theme] : null;

    useEffect(() => {
        if (props.theme) {
            setTheme(props.theme);
        }
    }, [props.theme]);

    useLayoutEffect(() => {
        if (config) {
            document.body.classList.add(config.className);
            return () => document.body.classList.remove(config.className);
        }
    }, [config]);

    useEffect(() => {
        (async () => (await getInitialTheme?.()) ?? ThemeTypes.PassDark)()
            .then(setTheme)
            .catch(() => setTheme(ThemeTypes.PassDark));
    }, []);

    return (
        <>
            {config && <style id={THEME_ID}>{config.styles}</style>}
            {props.children}
        </>
    );
};
