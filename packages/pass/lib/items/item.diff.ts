import type { ItemContent, ItemExtraField } from '../../types/data/items';
import type { ItemType, Metadata } from '../../types/protobuf';

type Diff<T extends object> = Partial<Record<keyof T, boolean>>;

export type ItemDiff<T extends ItemType> = {
    content: Diff<ItemContent<T>>;
    metadata: Diff<Metadata>;
    extraFields: Diff<ItemExtraField[]>;
};
