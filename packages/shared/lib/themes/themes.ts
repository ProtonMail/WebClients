// @ts-nocheck Disable import errors from ds
import themeDarkSvg from 'design-system/assets/img/pm-images/theme-dark.svg';
import themeTestSvg from 'design-system/assets/img/pm-images/theme-company.svg';
import themeDarkmodeSvg from 'design-system/assets/img/pm-images/theme-darkmode.svg';
import defaultTheme from 'design-system/scss/themes/default-theme.scss';
import darkTheme from 'design-system/scss/themes/dark-theme.scss';

import { c } from 'ttag';

export const CUSTOM_THEME = {
    getI18NLabel() {
        return c('Theme').t`Custom mode`;
    },
    identifier: '/* custom-theme */',
    src: themeTestSvg,
    customizable: true,
} as const;

export enum ThemeTypes {
    Default = 0,
    Dark = 1,
}

export const PROTON_THEMES = {
    DEFAULT: {
        getI18NLabel() {
            return c('Theme').t`Default`;
        },
        identifier: ThemeTypes.Default,
        src: themeDarkSvg,
        theme: defaultTheme.toString(),
    },
    DARK: {
        getI18NLabel() {
            return c('Theme').t`Dark`;
        },
        identifier: ThemeTypes.Dark,
        src: themeDarkmodeSvg,
        theme: darkTheme.toString(),
    },
} as const;
