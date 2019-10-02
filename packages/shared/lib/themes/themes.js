import themeDarkSvg from 'design-system/assets/img/pm-images/theme-dark.svg';
import themeLightSvg from 'design-system/assets/img/pm-images/theme-light.svg';
import themeBlueSvg from 'design-system/assets/img/pm-images/theme-blue.svg';
import themeTestSvg from 'design-system/assets/img/pm-images/theme-test.svg';
import lightTheme from 'design-system/_sass/pm-styles/_pm-light-theme.scss';
import blueTheme from 'design-system/_sass/pm-styles/_pm-blue-theme.scss';
import { c } from 'ttag';

export const PROTON_THEMES = {
    DARK: {
        getI18NLabel() {
            return c('Theme').t`Dark (Default)`;
        },
        identifier: '/* dark-theme */',
        src: themeDarkSvg,
        theme: '',
        customizable: false
    },
    LIGHT: {
        getI18NLabel() {
            return c('Theme').t`Light`;
        },
        identifier: '/* light-theme */',
        src: themeLightSvg,
        theme: lightTheme,
        customizable: false
    },
    BLUE: {
        getI18NLabel() {
            return c('Theme').t`Blue`;
        },
        identifier: '/* blue-theme */',
        src: themeBlueSvg,
        theme: blueTheme,
        customizable: false
    }
};

export const ALL_THEMES = {
    ...PROTON_THEMES,
    CUSTOM: {
        getI18NLabel() {
            return c('Theme').t`Custom theme`;
        },
        identifier: '/* custom-theme */',
        src: themeTestSvg,
        customizable: true
    }
};

export const DEFAULT_THEME = 'DARK';
