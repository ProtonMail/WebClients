import { ThemeTypes } from '@proton/shared/lib/themes/themes';

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
