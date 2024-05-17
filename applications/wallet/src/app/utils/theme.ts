/**
 * sub-theme is used to distinguish user's wallets
 */
export enum SubTheme {
    ORANGE = 'ui-orange',
    BLUE = 'ui-blue',
    PINK = 'ui-pink',
    GREEN = 'ui-green',
    PURPLE = 'ui-purple',
}

const subthemes = new Set([SubTheme.ORANGE, SubTheme.BLUE, SubTheme.PURPLE, SubTheme.GREEN, SubTheme.PINK]);

export const getThemeByIndex = (index: number) => {
    const t = Array.from(subthemes);
    return t[index % t.length];
};
