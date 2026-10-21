import { useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { useFoldersAccess } from '../../components/Folders/useFoldersAccess';
import { deobfuscateItem } from '../../lib/items/item.obfuscation';
import type { DeobfuscatedItem, ItemRevision } from '../../types/data/items';
import type { BaseItemValues } from '../../types/forms/item';
import type { MaybeNull } from '../../types/utils';

export type ItemCloneLocationState = { clone: ItemRevision };
export type ItemInitialValuesOptions = { clone: DeobfuscatedItem; shareId: string; folderId: MaybeNull<string> };

export const useInitialValues = <T extends BaseItemValues>(hydrate: (options?: ItemInitialValuesOptions) => T) => {
    const history = useHistory<MaybeNull<ItemCloneLocationState>>();
    const { state } = history.location;
    const { canUseFolders } = useFoldersAccess();

    useEffect(() => {
        if (state?.clone) history.replace({ ...history.location, state: null });
    }, []);

    return useMemo<T>(() => {
        if (!state?.clone) return hydrate();

        return hydrate({
            clone: deobfuscateItem(state.clone.data),
            shareId: state.clone.shareId,
            folderId: canUseFolders ? state.clone.folderId : null,
        });
    }, []);
};
