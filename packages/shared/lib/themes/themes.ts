// @ts-nocheck Disable import errors from ds
import themeDefaultSvg from '@proton/styles/assets/img/themes/theme-thumb-proton.svg';
import themeDefaultSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-proton-small.svg';
import defaultTheme from '@proton/colors/themes/proton.theme.css';

import themeCarbonSvg from '@proton/styles/assets/img/themes/theme-thumb-carbon.svg';
import themeCarbonSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-carbon-small.svg';
import carbonTheme from '@proton/colors/themes/carbon.theme.css';

import themeMonokaiSvg from '@proton/styles/assets/img/themes/theme-thumb-monokai.svg';
import themeMonokaiSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-monokai-small.svg';
import monokaiTheme from '@proton/colors/themes/monokai.theme.css';

import themeDuotoneSvg from '@proton/styles/assets/img/themes/theme-thumb-duotone.svg';
import themeDuotoneSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-duotone-small.svg';
import duotoneTheme from '@proton/colors/themes/duotone.theme.css';

import themeContrastSvg from '@proton/styles/assets/img/themes/theme-thumb-contrast.svg';
import themeContrastSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-contrast-small.svg';
import contrastTheme from '@proton/colors/themes/contrast.theme.css';

import themeLegacySvg from '@proton/styles/assets/img/themes/theme-thumb-legacy.svg';
import themeLegacySvgSmall from '@proton/styles/assets/img/themes/theme-thumb-legacy-small.svg';
import legacyTheme from '@proton/colors/themes/legacy.theme.css';

export enum HistoricThemeTypes {
    V1_Default = 0,
    V1_Light = 2,
    V1_Contrast = 4,
}

export enum ThemeTypes {
    Default = 6,
    Carbon = 1,
    Monokai = 3,
    Duotone = 8,
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
        src: {
            medium: themeDefaultSvg,
            small: themeDefaultSvgSmall,
        },
        theme: defaultTheme.toString(),
    },
    [ThemeTypes.Carbon]: {
        label: 'Carbon',
        identifier: ThemeTypes.Carbon,
        src: {
            medium: themeCarbonSvg,
            small: themeCarbonSvgSmall,
        },
        theme: carbonTheme.toString(),
    },
    [ThemeTypes.Monokai]: {
        label: 'Monokai',
        identifier: ThemeTypes.Monokai,
        src: {
            medium: themeMonokaiSvg,
            small: themeMonokaiSvgSmall,
        },
        theme: monokaiTheme.toString(),
    },
    [ThemeTypes.Duotone]: {
        label: 'Duotone',
        identifier: ThemeTypes.Duotone,
        src: {
            medium: themeDuotoneSvg,
            small: themeDuotoneSvgSmall,
        },
        theme: duotoneTheme.toString(),
    },
    [ThemeTypes.Contrast]: {
        label: 'Contrast',
        identifier: ThemeTypes.Contrast,
        src: {
            medium: themeContrastSvg,
            small: themeContrastSvgSmall,
        },
        theme: contrastTheme.toString(),
    },
    [ThemeTypes.Legacy]: {
        label: 'Legacy',
        identifier: ThemeTypes.Legacy,
        src: {
            medium: themeLegacySvg,
            small: themeLegacySvgSmall,
        },
        theme: legacyTheme.toString(),
    },
} as const;

export const DARK_THEMES = [ThemeTypes.Carbon, ThemeTypes.Monokai];

export const PROTON_THEMES = [
    ThemeTypes.Default,
    ThemeTypes.Carbon,
    ThemeTypes.Monokai,
    ThemeTypes.Duotone,
    ThemeTypes.Contrast,
    ThemeTypes.Legacy,
].map((id) => PROTON_THEMES_MAP[id]);
