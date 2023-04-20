import { Item, ItemType } from '@proton/pass/types';

export type ItemMatchFuncMap = { [T in ItemType]: ItemMatchFunc<T> };
export type ItemMatchFunc<T extends ItemType = ItemType> = (item: Item<T>) => (searchTerm: string) => boolean;
