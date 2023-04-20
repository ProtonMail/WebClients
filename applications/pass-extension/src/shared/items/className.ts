import type { ItemMap } from '@proton/pass/types';

export const itemTypeToItemClassName: ItemMap<string> = {
    login: 'ui-login',
    note: 'ui-note',
    alias: 'ui-alias',
};
