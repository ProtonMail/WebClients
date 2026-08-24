import { useMemo } from 'react';

import { deobfuscateItem, deobfuscateItemPartial } from '../lib/items/item.obfuscation';
import type { DeobfuscatedItem, Item, ItemType } from '../types';
import type { DeobfuscateMode } from '../types/data/obfuscation';

export const useDeobfuscatedItem = <T extends ItemType>(item: Item<T>) =>
    useMemo(() => deobfuscateItem(item as Item) as DeobfuscatedItem<T>, [item]);

export const usePartialDeobfuscatedItem = <T extends ItemType>(item: Item<T>) =>
    useMemo(() => deobfuscateItemPartial(item as Item) as DeobfuscatedItem<T, DeobfuscateMode.AUTO>, [item]);
