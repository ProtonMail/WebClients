/**
 * sub-theme is used to distinguish user's wallets
 */
export enum SubTheme {
    BLUE = 'ui-blue',
    GREEN = 'ui-green',
    ORANGE = 'ui-orange',
    PINK = 'ui-pink',
    PURPLE = 'ui-purple',
}

export const getThemeByIndex = (index: number) => {
    const themes = Object.values(SubTheme);
    return themes[index % themes.length];
};
