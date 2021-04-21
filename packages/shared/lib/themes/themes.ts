// @ts-nocheck Disable import errors from ds
import themeLightSvg from 'design-system/assets/img/themes/theme-light.svg';
import themeDarkSvg from 'design-system/assets/img/themes/theme-dark.svg';
import themeContrastSvg from 'design-system/assets/img/themes/theme-contrast.svg';
import themeDefaultSvg from 'design-system/assets/img/themes/theme-default.svg';
import themeMonokaiSvg from 'design-system/assets/img/themes/theme-monokai.svg';

import defaultTheme from 'design-system/scss/themes/default-theme.scss';
import darkTheme from 'design-system/scss/themes/dark-theme.scss';
import lightTheme from 'design-system/scss/themes/light-theme.scss';
import monokaiTheme from 'design-system/scss/themes/monokai-theme.scss';
import contrastTheme from 'design-system/scss/themes/contrast-theme.scss';

import { c } from 'ttag';

export enum ThemeTypes {
    Default = 0,
    Dark = 1,
    Light = 2,
    Monokai = 3,
    Contrast = 4,
}

export const PROTON_THEMES = {
    DEFAULT: {
        getI18NLabel: () => c('Theme').t`Proton (default)`,
        identifier: ThemeTypes.Default,
        src: themeDefaultSvg,
        theme: defaultTheme.toString(),
    },
    DARK: {
        getI18NLabel: () => c('Theme').t`Carbon`,
        identifier: ThemeTypes.Dark,
        src: themeDarkSvg,
        theme: darkTheme.toString(),
    },
    LIGHT: {
        getI18NLabel: () => c('Theme').t`Snow`,
        identifier: ThemeTypes.Light,
        src: themeLightSvg,
        theme: lightTheme.toString(),
    },
    MONOKAI: {
        getI18NLabel: () => c('Theme').t`Monokai`,
        identifier: ThemeTypes.Monokai,
        src: themeMonokaiSvg,
        theme: monokaiTheme.toString(),
    },
    CONTRAST: {
        getI18NLabel: () => c('Theme').t`Contrast`,
        identifier: ThemeTypes.Contrast,
        src: themeContrastSvg,
        theme: contrastTheme.toString(),
    },
} as const;
