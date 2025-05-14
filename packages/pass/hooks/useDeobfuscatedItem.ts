import { useMemo } from 'react';

import { deobfuscateItem, deobfuscateItemPartial } from '@proton/pass/lib/items/item.obfuscation';
import type { DeobfuscatedItem, Item, ItemType } from '@proton/pass/types';
import type { DeobfuscateMode } from '@proton/pass/types/data/obfuscation';

export const useDeobfuscatedItem = <T extends ItemType>(item: Item<T>) =>
    useMemo(() => deobfuscateItem(item as Item) as DeobfuscatedItem<T>, [item]);

export const usePartialDeobfuscatedItem = <T extends ItemType>(item: Item<T>) =>
    useMemo(() => deobfuscateItemPartial(item as Item) as DeobfuscatedItem<T, DeobfuscateMode.AUTO>, [item]);
