import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import conversationFullSvgDark from '@proton/styles/assets/img/placeholders/inbox-cool-dark.svg';
import conversationFullSvgLight from '@proton/styles/assets/img/placeholders/inbox-cool-light.svg';
import conversationEmptySvgDark from '@proton/styles/assets/img/placeholders/inbox-empty-cool-dark.svg';
import conversationEmptySvgLight from '@proton/styles/assets/img/placeholders/inbox-empty-cool-light.svg';
import conversationEmptySvgWarm from '@proton/styles/assets/img/placeholders/inbox-empty-warm-light.svg';
import conversationSemiSvgDark from '@proton/styles/assets/img/placeholders/inbox-semi-cool-dark.svg';
import conversationSemiSvgLight from '@proton/styles/assets/img/placeholders/inbox-semi-cool-light.svg';
import conversationSemiSvgWarm from '@proton/styles/assets/img/placeholders/inbox-semi-warm-light.svg';
import conversationFullSvgWarm from '@proton/styles/assets/img/placeholders/inbox-warm-light.svg';

interface Params {
    theme: ThemeTypes;
    warmLight: string;
    coolLight: string;
    coolDark: string;
}

/**
 * Placeholders are theme dependant since the warmness of the grey depends on the theme.
 * This method returns the appropriate src based on the theme the user has set.
 * @param object containing the theme type information and the different image src.
 * @returns the appropriate src based on the theme
 */
export const getPlaceholderSrc = ({ theme, warmLight, coolLight, coolDark }: Params) => {
    if (theme === ThemeTypes.Duotone || theme === ThemeTypes.Snow || theme === ThemeTypes.ContrastLight) {
        return warmLight;
    }

    if (theme === ThemeTypes.Classic || theme === ThemeTypes.Legacy) {
        return coolLight;
    }

    if (theme === ThemeTypes.Carbon || theme === ThemeTypes.Monokai || theme === ThemeTypes.ContrastDark) {
        return coolDark;
    }

    return warmLight;
};

interface Temp {
    size: number;
    theme: ThemeTypes;
}

export const getInboxEmptyPlaceholder = ({ size, theme }: Temp) => {
    if (size === 0) {
        return getPlaceholderSrc({
            theme,
            coolDark: conversationEmptySvgDark,
            coolLight: conversationEmptySvgLight,
            warmLight: conversationEmptySvgWarm,
        });
    }

    if (size < 10) {
        return getPlaceholderSrc({
            theme,
            coolDark: conversationSemiSvgDark,
            coolLight: conversationSemiSvgLight,
            warmLight: conversationSemiSvgWarm,
        });
    }

    return getPlaceholderSrc({
        theme,
        coolDark: conversationFullSvgDark,
        coolLight: conversationFullSvgLight,
        warmLight: conversationFullSvgWarm,
    });
};
