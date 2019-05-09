import { THEMES } from 'proton-shared/lib/constants';

const {
    DARK: { identifier: darkId },
    LIGHT: { identifier: lightId },
    BLUE: { identifier: blueId },
    CUSTOM: { identifier: customId }
} = THEMES;

/**
 * Given a theme, return identifier
 * @param {theme} string            CSS associated to a theme
 * @return {string}                 theme identifier
 */
export const getThemeIdentifier = (theme) => {
    if (!theme) {
        return darkId;
    }
    if (theme !== darkId && theme !== lightId && theme !== blueId) {
        return customId;
    }
    return theme;
};

/**
 * Given a theme identifier with commented code as '\/* something *\/', extract 'something'
 * @param {themeIdentifier} string		theme identifier with comment markers
 * @return {string}                     theme identifier without comment markers
 */
export const stripThemeIdentifier = (themeIdentifier) => {
    const regex = /\/\*(.*)\*\//;
    if (regex.test(themeIdentifier)) {
        return themeIdentifier.match(/\/\*(.*)\*\//)[1].trim();
    }
    return themeIdentifier;
};
