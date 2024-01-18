import React, { createContext, useContext, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import {
    VaultSelect,
    type VaultSelectMode,
    useVaultSelectModalHandles,
} from '@proton/pass/components/Vault/VaultSelect';
import { itemMoveIntent } from '@proton/pass/store/actions';
import type { ItemRevision, MaybeNull } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

/** Ongoing: move every item action definition to this
 * context object. This context should be loosely connected */
type ItemActionsContextType = {
    move: (item: ItemRevision, mode: VaultSelectMode) => void;
};

const ItemActionsContext = createContext<MaybeNull<ItemActionsContextType>>(null);

export const ItemActionsProvider: React.FC = ({ children }) => {
    const { selectItem } = useNavigation();
    const dispatch = useDispatch();
    const { closeVaultSelect, openVaultSelect, modalState } = useVaultSelectModalHandles();

    const moveItem = (item: ItemRevision) => (shareId: string) => {
        const optimisticId = uniqueId();
        dispatch(itemMoveIntent({ item, shareId, optimisticId }));
        selectItem(shareId, optimisticId, { mode: 'replace', filters: { selectedShareId: shareId } });
        closeVaultSelect();
    };

    const context = useMemo<ItemActionsContextType>(() => {
        return {
            move: (item, mode) => openVaultSelect({ shareId: item.shareId, mode, onSubmit: moveItem(item) }),
        };
    }, []);

    return (
        <ItemActionsContext.Provider value={context}>
            {children}

            <VaultSelect
                downgradeMessage={c('Info')
                    .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your first two vaults. To move items between all vaults upgrade your subscription.`}
                onClose={closeVaultSelect}
                {...modalState}
            />
        </ItemActionsContext.Provider>
    );
};

export const useItemsActions = (): ItemActionsContextType => useContext(ItemActionsContext)!;
