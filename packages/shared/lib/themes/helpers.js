import { PROTON_THEMES, CUSTOM_THEME, DEFAULT_THEME } from './themes';

const { protonThemeIdentifiers, protonThemes } = Object.values(PROTON_THEMES).reduce(
    (acc, { identifier, theme }) => {
        acc.protonThemeIdentifiers.push(identifier);
        acc.protonThemes[identifier] = theme;
        return acc;
    },
    { protonThemeIdentifiers: [], protonThemes: Object.create(null) }
);
const defaultThemeIdentifier = DEFAULT_THEME.identifier;

/**
 * Given a theme, return identifier
 * @param {String} theme            CSS associated to a theme
 * @return {String}                 theme identifier
 */
export const getThemeIdentifier = (theme) => {
    if (!theme) {
        return defaultThemeIdentifier;
    }
    if (![defaultThemeIdentifier, ...protonThemeIdentifiers].includes(theme)) {
        return CUSTOM_THEME.identifier;
    }
    // for proton themes, the CSS for the theme coincides with the identifier
    return theme;
};

/**
 * Given a theme identifier, return true if it's the custom theme identifier, false otherwise
 * @param {String} themeIdentifier
 * @return {Boolean}
 */
export const isCustomThemeIdentifier = (themeIdentifier) => {
    return themeIdentifier === CUSTOM_THEME.identifier;
};

/**
 * Given a theme, return true if it's a custom one, false otherwise
 * @param {String} theme
 * @return {Boolean}
 */
export const isCustomTheme = (theme) => {
    return isCustomThemeIdentifier(getThemeIdentifier(theme));
};

/**
 * Given a theme, return true if it corresponds to dark mode, false otherwise
 * @param {String} theme
 * @return {Boolean}
 */
export const isDarkTheme = (theme) => {
    return getThemeIdentifier(theme) === PROTON_THEMES.DARK.identifier;
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
