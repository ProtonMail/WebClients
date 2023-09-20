import { useMemo } from 'react';

import type { Item, ItemType, UnsafeItem } from '@proton/pass/types';
import { deobfuscateItem } from '@proton/pass/utils/pass/items';

export const useDeobfuscatedItem = <T extends ItemType>(item: Item<T>) =>
    useMemo(() => deobfuscateItem(item as Item) as UnsafeItem<T>, [item]);
