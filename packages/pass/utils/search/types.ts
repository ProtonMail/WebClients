import type { Item, ItemType } from '@proton/pass/types';

export type ItemMatchFuncMap = { [T in ItemType]: ItemMatchFunc<T> };
export type ItemMatchFunc<T extends ItemType = ItemType, Options extends any = any> = (
    item: Item<T>
) => (searchTerm: string, options?: Options) => boolean;
