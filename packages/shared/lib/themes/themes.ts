// @ts-nocheck Disable import errors from ds
import carbonTheme from '@proton/colors/themes/dist/carbon.theme.css';
import classicTheme from '@proton/colors/themes/dist/classic.theme.css';
import contrastTheme from '@proton/colors/themes/dist/contrast.theme.css';
import duotoneTheme from '@proton/colors/themes/dist/duotone.theme.css';
import legacyTheme from '@proton/colors/themes/dist/legacy.theme.css';
import monokaiTheme from '@proton/colors/themes/dist/monokai.theme.css';
import passTheme from '@proton/colors/themes/dist/pass.theme.css';
import snowTheme from '@proton/colors/themes/dist/snow.theme.css';
import themeCarbonSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-carbon-small.svg';
import themeCarbonSvg from '@proton/styles/assets/img/themes/theme-thumb-carbon.svg';
import themeClassicSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-classic-small.svg';
import themeClassicSvg from '@proton/styles/assets/img/themes/theme-thumb-classic.svg';
import themeContrastSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-contrast-small.svg';
import themeContrastSvg from '@proton/styles/assets/img/themes/theme-thumb-contrast.svg';
import themeDuotoneSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-duotone-small.svg';
import themeDuotoneSvg from '@proton/styles/assets/img/themes/theme-thumb-duotone.svg';
import themeLegacySvgSmall from '@proton/styles/assets/img/themes/theme-thumb-legacy-small.svg';
import themeLegacySvg from '@proton/styles/assets/img/themes/theme-thumb-legacy.svg';
import themeMonokaiSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-monokai-small.svg';
import themeMonokaiSvg from '@proton/styles/assets/img/themes/theme-thumb-monokai.svg';
import themeSnowSvgSmall from '@proton/styles/assets/img/themes/theme-thumb-snow-small.svg';
import themeSnowSvg from '@proton/styles/assets/img/themes/theme-thumb-snow.svg';

export enum ThemeTypes {
    Duotone = 0,
    Carbon = 1,
    Snow = 2,
    Monokai = 3,
    Contrast = 4,
    Legacy = 5,
    Classic = 6,
    Pass = 7,
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
    [ThemeTypes.Classic]: {
        label: 'Classic',
        identifier: ThemeTypes.Classic,
        src: {
            medium: themeClassicSvg,
            small: themeClassicSvgSmall,
        },
        theme: classicTheme.toString(),
    },
    [ThemeTypes.Pass]: {
        label: 'Pass',
        identifier: ThemeTypes.Pass,
        src: {
            medium: themeClassicSvg,
            small: themeClassicSvgSmall,
        },
        theme: passTheme.toString(),
    },
} as const;

export const DARK_THEMES = [ThemeTypes.Carbon, ThemeTypes.Monokai, ThemeTypes.Pass];

export const PROTON_THEMES = [
    ThemeTypes.Duotone,
    ThemeTypes.Classic,
    ThemeTypes.Carbon,
    ThemeTypes.Monokai,
    ThemeTypes.Snow,
    ThemeTypes.Contrast,
    ThemeTypes.Legacy,
].map((id) => PROTON_THEMES_MAP[id]);
