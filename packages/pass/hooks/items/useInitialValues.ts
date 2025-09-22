import { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { deobfuscateItem } from '@proton/pass/lib/items/item.obfuscation';
import type { DeobfuscatedItem, ItemRevision, MaybeNull } from '@proton/pass/types';
import type { BaseItemValues } from '@proton/pass/types/forms';

export type ItemCloneLocationState = { clone: ItemRevision };
export type ItemInitialValuesOptions = { clone: DeobfuscatedItem; shareId: string };

export const useInitialValues = <T extends BaseItemValues>(hydrate: (options?: ItemInitialValuesOptions) => T) => {
    const history = useHistory<MaybeNull<ItemCloneLocationState>>();
    const { state } = history.location;

    useEffect(() => {
        if (state?.clone) history.replace({ ...history.location, state: null });
    }, []);

    return useMemo<T>(() => {
        if (!state?.clone) return hydrate();

        return hydrate({
            clone: deobfuscateItem(state.clone.data),
            shareId: state.clone.shareId,
        });
    }, []);
};
