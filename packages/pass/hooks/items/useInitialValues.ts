import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { DeobfuscatedItem, ItemRevision, MaybeNull } from '@proton/pass/types';
import type { BaseItemValues } from '@proton/pass/types/forms';

export type ItemCloneLocationState = { clone: ItemRevision };
export type ItemInitialValuesOptions = { clone: DeobfuscatedItem; shareId: string };

export const useInitialValues = <T extends BaseItemValues>(hydrate: (options?: ItemInitialValuesOptions) => T) => {
    const history = useHistory<MaybeNull<ItemCloneLocationState>>();

    return useMemo<T>(() => {
        const { state } = history.location;
        if (!state?.clone) return hydrate();

        history.replace({ ...history.location, state: null });

        return hydrate({
            clone: deobfuscateItem(state.clone.data),
            shareId: state.clone.shareId,
        });
    }, []);
};
