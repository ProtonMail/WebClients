// @ts-nocheck Disable import errors from ds
import themeDefaultSvg from '@proton/styles/assets/img/themes/theme-default.svg';
import defaultTheme from '@proton/styles/scss/themes/default-theme.scss';

import themeDarkSvg from '@proton/styles/assets/img/themes/theme-dark.svg';
import darkTheme from '@proton/styles/scss/themes/dark-theme.scss';

import themeMonokaiSvg from '@proton/styles/assets/img/themes/theme-monokai.svg';
import monokaiTheme from '@proton/styles/scss/themes/monokai-theme.scss';

import themeContrastSvg from '@proton/styles/assets/img/themes/theme-contrast.svg';
import contrastTheme from '@proton/styles/scss/themes/contrast-theme.scss';

import themeLegacySvg from '@proton/styles/assets/img/themes/theme-legacy.svg';
import legacyTheme from '@proton/styles/scss/themes/legacy-theme.scss';

export enum HistoricThemeTypes {
    V1_Default = 0,
    V1_Light = 2,
    V1_Contrast = 4,
}

export enum ThemeTypes {
    Default = 6,
    Dark = 1,
    Monokai = 3,
    Contrast = 7,
    Legacy = 5,
}

export const ThemeMigrationMap: Partial<{ [key in HistoricThemeTypes]: ThemeTypes | HistoricThemeTypes }> = {
    [HistoricThemeTypes.V1_Default]: ThemeTypes.Contrast,
    [HistoricThemeTypes.V1_Contrast]: ThemeTypes.Default,
};

export const PROTON_THEMES_MAP = {
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

export const PROTON_THEMES = [
    ThemeTypes.Default,
    ThemeTypes.Dark,
    ThemeTypes.Monokai,
    ThemeTypes.Contrast,
    ThemeTypes.Legacy,
].map((id) => PROTON_THEMES_MAP[id]);
