import { PROTON_THEMES, ALL_THEMES, DEFAULT_THEME } from './themes';

const { protonThemeIdentifiers, protonThemes } = Object.values(PROTON_THEMES).reduce(
    (acc, { identifier, theme }) => {
        acc.protonThemeIdentifiers.push(identifier);
        acc.protonThemes[identifier] = theme;
        return acc;
    },
    { protonThemeIdentifiers: [], protonThemes: Object.create(null) }
);
const {
    [DEFAULT_THEME]: { identifier: defaultThemeIdentifier },
    CUSTOM: { identifier: customThemeIdentifier }
} = ALL_THEMES;

/**
 * Given a theme, return identifier
 * @param {String} theme            CSS associated to a theme
 * @return {String}                 theme identifier
 */
export const getThemeIdentifier = (theme) => {
    if (!theme) {
        return defaultThemeIdentifier;
    }
    if (!protonThemeIdentifiers.includes(theme)) {
        return customThemeIdentifier;
    }
    return theme;
};

/**
 * Given a theme identifier with commented code as '\/* something *\/', extract 'something'
 * @param {String} themeIdentifier      theme identifier with comment markers
 * @return {String}                     theme identifier without comment markers
 */
export const stripThemeIdentifier = (themeIdentifier) => {
    const regex = /\/\*(.*)\*\//;
    if (regex.test(themeIdentifier)) {
        return themeIdentifier.match(/\/\*(.*)\*\//)[1].trim();
    }
    return themeIdentifier;
};

/**
 * Given a theme identifier, return theme
 * @param {String} themeIdentifier          theme identifier
 * @return {String}                         CSS associated with the theme
 */
export const getTheme = (themeIdentifier) => {
    if (protonThemeIdentifiers.includes(themeIdentifier)) {
        return protonThemes[themeIdentifier];
    }
    return '';
};

/**
 * Concat themes
 * @param {Array<String>} themes
 * @returns {String}
 */
export const toStyle = (themes = []) => themes.join('\n');
