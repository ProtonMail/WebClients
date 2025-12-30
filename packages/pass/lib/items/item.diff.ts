import isDeepEqual from 'lodash/isEqual';

import type { ItemContent, ItemExtraField, ItemRevision, ItemType, Metadata } from '@proton/pass/types';

type Diff<T extends object> = Partial<Record<keyof T, boolean>>;

export type ItemDiff<T extends ItemType> = {
    content: Diff<ItemContent<T>>;
    metadata: Diff<Metadata>;
    extraFields: Diff<ItemExtraField[]>;
};

const diffedKeys = <T extends object>(a: T, b: T): Diff<T> =>
    (Object.keys(a) as (keyof T)[]).reduce<Diff<T>>((diff, key) => {
        if (!isDeepEqual(a[key], b[key])) diff[key] = true;
        return diff;
    }, {});

export const itemDiff = <T extends ItemType>(
    { data: a }: ItemRevision<T>,
    { data: b }: ItemRevision<T>
): ItemDiff<T> => ({
    content: diffedKeys(a.content, b.content),
    metadata: diffedKeys(a.metadata, b.metadata),
    extraFields: diffedKeys(a.extraFields, b.extraFields),
});
