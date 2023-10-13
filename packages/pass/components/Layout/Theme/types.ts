import type { ItemMap } from '@proton/pass/types';

export enum SubTheme {
    LIME = 'ui-lime',
    ORANGE = 'ui-orange',
    RED = 'ui-red',
    TEAL = 'ui-teal',
    VIOLET = 'ui-violet',
}

export const itemTypeToSubThemeClassName: ItemMap<SubTheme> = {
    alias: SubTheme.TEAL,
    creditCard: SubTheme.LIME,
    login: SubTheme.VIOLET,
    note: SubTheme.ORANGE,
};
