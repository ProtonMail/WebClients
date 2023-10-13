import { useMemo } from 'react';

import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { Item, ItemType, UnsafeItem } from '@proton/pass/types';

export const useDeobfuscatedItem = <T extends ItemType>(item: Item<T>) =>
    useMemo(() => deobfuscateItem(item as Item) as UnsafeItem<T>, [item]);
