import type { DesktopTheme, ItemMap } from '@proton/pass/types';

export enum SubTheme {
    LIME = 'ui-lime',
    ORANGE = 'ui-orange',
    RED = 'ui-red',
    TEAL = 'ui-teal',
    VIOLET = 'ui-violet',
    PURPLE = 'ui-purple',
}

export const itemTypeToSubThemeClassName: ItemMap<SubTheme> = {
    alias: SubTheme.TEAL,
    creditCard: SubTheme.LIME,
    login: SubTheme.VIOLET,
    note: SubTheme.ORANGE,
    identity: SubTheme.PURPLE,
    sshKey: SubTheme.PURPLE, // TODO(@djankovic): FIXME
    wifi: SubTheme.PURPLE, // TODO(@djankovic): FIXME
    custom: SubTheme.PURPLE, // TODO(@djankovic): FIXME
};

/** Avoid importing `ThemeTypes` as it is not
 * side-effect free: it will import all css files */
export enum PassThemeOption {
    /** ThemeTypes.PassDark = 8 */
    PassDark = 8,
    /** ThemeTypes.PassDark = 12 */
    PassLight = 12,
    OS = 'OS',
}

export const themeOptionToDesktop: Record<PassThemeOption, DesktopTheme> = {
    [PassThemeOption.PassDark]: 'dark',
    [PassThemeOption.PassLight]: 'light',
    [PassThemeOption.OS]: 'system',
};
