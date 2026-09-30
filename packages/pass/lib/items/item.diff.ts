import type { ItemContent, ItemExtraField, ItemType, Metadata } from '../../types';

type Diff<T extends object> = Partial<Record<keyof T, boolean>>;

export type ItemDiff<T extends ItemType> = {
    content: Diff<ItemContent<T>>;
    metadata: Diff<Metadata>;
    extraFields: Diff<ItemExtraField[]>;
};
