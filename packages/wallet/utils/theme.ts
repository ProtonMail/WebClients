/** Avoid importing `ThemeTypes` as it is not side effect free: it will import all css files */
export enum WalletThemeOption {
    /** ThemeTypes.WalletLight = 10 */
    WalletLight = 10,
    /** ThemeTypes.WalletDark = 13 */
    WalletDark = 13,
}

const matchDarkTheme = () => window.matchMedia('(prefers-color-scheme: dark)');

export const getWalletDefaultTheme = () => {
    return matchDarkTheme().matches ? WalletThemeOption.WalletDark : WalletThemeOption.WalletLight;
};
