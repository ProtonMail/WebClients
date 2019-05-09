import { c } from 'ttag';
import { THEMES } from 'proton-shared/lib/constants';
import themeDarkSvg from 'design-system/assets/img/pm-images/theme-dark.svg';
import themeLightSvg from 'design-system/assets/img/pm-images/theme-light.svg';
import themeBlueSvg from 'design-system/assets/img/pm-images/theme-blue.svg';
import themeTestSvg from 'design-system/assets/img/pm-images/theme-test.svg';
import { stripThemeIdentifier } from 'react-components/helpers/themes';

const {
    DARK: { label: darkLabel, identifier: darkId },
    LIGHT: { label: lightLabel, identifier: lightId },
    BLUE: { label: blueLabel, identifier: blueId },
    CUSTOM: { label: customLabel, identifier: customId }
} = THEMES;

const themeDark = {
    label: c('Theme label').t`${darkLabel}`,
    id: darkId,
    alt: stripThemeIdentifier(darkId),
    src: themeDarkSvg,
    customizable: false
};

const themeLight = {
    label: c('Theme label').t`${lightLabel}`,
    id: lightId,
    alt: stripThemeIdentifier(lightId),
    src: themeLightSvg,
    customizable: false
};

const themeBlue = {
    label: c('Theme label').t`${blueLabel}`,
    id: blueId,
    alt: stripThemeIdentifier(blueId),
    src: themeBlueSvg,
    customizable: false
};

const themeCustom = {
    label: c('Theme label').t`${customLabel}`,
    id: customId,
    alt: stripThemeIdentifier(customId),
    src: themeTestSvg,
    customizable: true
};

export const availableThemes = [themeDark, themeLight, themeBlue, themeCustom];
