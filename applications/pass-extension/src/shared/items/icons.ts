import type { IconName } from '@proton/components/components/icon';
import type { Item, ItemMap } from '@proton/pass/types';

export const itemTypeToIconName: ItemMap<IconName> = {
    login: 'user',
    note: 'file-lines',
    alias: 'alias',
    creditCard: 'credit-card',
};

export const presentItemIcon = (item: Item) => itemTypeToIconName[item.type];
