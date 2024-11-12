import type { ItemMap } from '@proton/pass/types';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';

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
};

export enum PassThemeOption {
    PassDark = ThemeTypes.PassDark,
    PassLight = ThemeTypes.PassLight,
    OS = 'OS',
}
