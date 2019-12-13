import themeDarkSvg from 'design-system/assets/img/pm-images/theme-dark.svg';
import themeLightSvg from 'design-system/assets/img/pm-images/theme-light.svg';
import themeBlueSvg from 'design-system/assets/img/pm-images/theme-blue.svg';
import themeTestSvg from 'design-system/assets/img/pm-images/theme-test.svg';
import themeDarkmodeSvg from 'design-system/assets/img/pm-images/theme-darkmode.svg';
import lightTheme from 'design-system/_sass/pm-styles/_pm-light-theme.scss';
import blueTheme from 'design-system/_sass/pm-styles/_pm-blue-theme.scss';
import darkMode from 'design-system/_sass/pm-styles/_pm-dark-theme.scss';
import { c } from 'ttag';

export const DEFAULT_THEME = {
    getI18NLabel() {
        return c('Theme').t`Default`;
    },
    identifier: '/* default-theme */',
    src: themeDarkSvg,
    theme: '',
    customizable: false
};

export const CUSTOM_THEME = {
    getI18NLabel() {
        return c('Theme').t`Custom theme`;
    },
    identifier: '/* custom-theme */',
    src: themeTestSvg,
    customizable: true
};

export const PROTON_THEMES = {
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
    },
    DARK: {
        getI18NLabel() {
            return c('Theme').t`Dark mode`;
        },
        identifier: '/* dark-mode */',
        src: themeDarkmodeSvg,
        theme: darkMode,
        customizable: false
    }
};
