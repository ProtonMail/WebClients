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

import { c } from 'ttag';

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
        getI18NLabel: () => c('Theme').t`Proton`,
        identifier: ThemeTypes.Default,
        src: themeDefaultSvg,
        theme: defaultTheme.toString(),
    },
    [ThemeTypes.Dark]: {
        getI18NLabel: () => c('Theme').t`Carbon`,
        identifier: ThemeTypes.Dark,
        src: themeDarkSvg,
        theme: darkTheme.toString(),
    },
    [ThemeTypes.Light]: {
        getI18NLabel: () => c('Theme').t`Snow`,
        identifier: ThemeTypes.Light,
        src: themeLightSvg,
        theme: lightTheme.toString(),
    },
    [ThemeTypes.Monokai]: {
        getI18NLabel: () => c('Theme').t`Monokai`,
        identifier: ThemeTypes.Monokai,
        src: themeMonokaiSvg,
        theme: monokaiTheme.toString(),
    },
    [ThemeTypes.Contrast]: {
        getI18NLabel: () => c('Theme').t`Contrast`,
        identifier: ThemeTypes.Contrast,
        src: themeContrastSvg,
        theme: contrastTheme.toString(),
    },
    [ThemeTypes.Legacy]: {
        getI18NLabel: () => c('Theme').t`Legacy`,
        identifier: ThemeTypes.Legacy,
        src: themeLegacySvg,
        theme: legacyTheme.toString(),
    },
} as const;
