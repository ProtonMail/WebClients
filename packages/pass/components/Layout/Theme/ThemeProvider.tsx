import { type FC, useEffect, useLayoutEffect, useState } from 'react';

// @ts-ignore
import passDarkTheme from '@proton/colors/themes/dist/pass-dark.theme.css';
// @ts-ignore
import passLightTheme from '@proton/colors/themes/dist/pass-light.theme.css';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PASS_DEFAULT_THEME } from '@proton/pass/constants';
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

export const ThemeProvider: FC<Props> = (props) => {
    const { getTheme } = usePassCore();
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
        (async () => (await getTheme?.()) ?? PASS_DEFAULT_THEME)()
            .then(setTheme)
            .catch(() => setTheme(PASS_DEFAULT_THEME));
    }, []);

    return <>{config && <style id={THEME_ID}>{config.styles}</style>}</>;
};
