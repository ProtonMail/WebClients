// @ts-nocheck Disable import errors from ds
import themeDuotoneSvg from '@proton/styles/assets/img/themes/theme-thumb-duotone.svg';
import themeDuotoneSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-duotone-small.svg';
import duotoneTheme from '@proton/colors/themes/dist/duotone.theme.css';

import themeCarbonSvg from '@proton/styles/assets/img/themes/theme-thumb-carbon.svg';
import themeCarbonSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-carbon-small.svg';
import carbonTheme from '@proton/colors/themes/dist/carbon.theme.css';

import themeMonokaiSvg from '@proton/styles/assets/img/themes/theme-thumb-monokai.svg';
import themeMonokaiSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-monokai-small.svg';
import monokaiTheme from '@proton/colors/themes/dist/monokai.theme.css';

import themeSnowSvg from '@proton/styles/assets/img/themes/theme-thumb-snow.svg';
import themeSnowSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-snow-small.svg';
import snowTheme from '@proton/colors/themes/dist/snow.theme.css';

import themeContrastSvg from '@proton/styles/assets/img/themes/theme-thumb-contrast.svg';
import themeContrastSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-contrast-small.svg';
import contrastTheme from '@proton/colors/themes/dist/contrast.theme.css';

import themeLegacySvg from '@proton/styles/assets/img/themes/theme-thumb-legacy.svg';
import themeLegacySvgSmall from '@proton/styles/assets/img/themes/theme-thumb-legacy-small.svg';
import legacyTheme from '@proton/colors/themes/dist/legacy.theme.css';

export enum ThemeTypes {
    Duotone = 0,
    Carbon = 1,
    Snow = 2,
    Monokai = 3,
    Contrast = 4,
    Legacy = 5,
}

export const PROTON_DEFAULT_THEME = ThemeTypes.Duotone;

export const PROTON_THEMES_MAP = {
    [ThemeTypes.Duotone]: {
        label: 'Proton',
        identifier: ThemeTypes.Duotone,
        src: {
            medium: themeDuotoneSvg,
            small: themeDuotoneSvgSmall,
        },
        theme: duotoneTheme.toString(),
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
    [ThemeTypes.Snow]: {
        label: 'Snow',
        identifier: ThemeTypes.Snow,
        src: {
            medium: themeSnowSvg,
            small: themeSnowSvgSmall,
        },
        theme: snowTheme.toString(),
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
    ThemeTypes.Duotone,
    ThemeTypes.Carbon,
    ThemeTypes.Monokai,
    ThemeTypes.Snow,
    ThemeTypes.Contrast,
    ThemeTypes.Legacy,
].map((id) => PROTON_THEMES_MAP[id]);
