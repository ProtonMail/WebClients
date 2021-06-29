// @ts-nocheck Disable import errors from ds
import themeDefaultSvg from '@proton/styles/assets/img/themes/theme-default.svg';
import defaultTheme from '@proton/styles/scss/themes/default-theme.scss';

import themeDarkSvg from '@proton/styles/assets/img/themes/theme-dark.svg';
import darkTheme from '@proton/styles/scss/themes/dark-theme.scss';

import themeLightSvg from '@proton/styles/assets/img/themes/theme-light.svg';
import lightTheme from '@proton/styles/scss/themes/light-theme.scss';

import themeMonokaiSvg from '@proton/styles/assets/img/themes/theme-monokai.svg';
import monokaiTheme from '@proton/styles/scss/themes/monokai-theme.scss';

import themeContrastSvg from '@proton/styles/assets/img/themes/theme-contrast.svg';
import contrastTheme from '@proton/styles/scss/themes/contrast-theme.scss';

import themeLegacySvg from '@proton/styles/assets/img/themes/theme-legacy.svg';
import legacyTheme from '@proton/styles/scss/themes/legacy-theme.scss';

export enum ThemeTypes {
    Default = 0,
    Dark = 1,
    Light = 2,
    Monokai = 3,
    Contrast = 4,
    Legacy = 5,
}

export const PROTON_THEMES = {
    [ThemeTypes.Default]: {
        label: 'Proton',
        identifier: ThemeTypes.Default,
        src: themeDefaultSvg,
        theme: defaultTheme.toString(),
    },
    [ThemeTypes.Dark]: {
        label: 'Carbon',
        identifier: ThemeTypes.Dark,
        src: themeDarkSvg,
        theme: darkTheme.toString(),
    },
    [ThemeTypes.Light]: {
        label: 'Snow',
        identifier: ThemeTypes.Light,
        src: themeLightSvg,
        theme: lightTheme.toString(),
    },
    [ThemeTypes.Monokai]: {
        label: 'Monokai',
        identifier: ThemeTypes.Monokai,
        src: themeMonokaiSvg,
        theme: monokaiTheme.toString(),
    },
    [ThemeTypes.Contrast]: {
        label: 'Contrast',
        identifier: ThemeTypes.Contrast,
        src: themeContrastSvg,
        theme: contrastTheme.toString(),
    },
    [ThemeTypes.Legacy]: {
        label: 'Legacy',
        identifier: ThemeTypes.Legacy,
        src: themeLegacySvg,
        theme: legacyTheme.toString(),
    },
} as const;
