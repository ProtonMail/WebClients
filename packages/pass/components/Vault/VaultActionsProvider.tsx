import { type FC, createContext, useContext, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { VaultDeleteModal } from '@proton/pass/components/Vault/VaultDeleteModal';
import { VaultSelectModal, useVaultSelectModalHandles } from '@proton/pass/components/Vault/VaultSelect.modal';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { vaultDeleteIntent, vaultMoveAllItemsIntent } from '@proton/pass/store/actions';
import { type ShareItem } from '@proton/pass/store/reducers';
import { selectWritableVaultsWithItemsCount } from '@proton/pass/store/selectors';
import type { MaybeNull, ShareType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type VaultActionsContextValue = {
    delete: (vault: ShareItem<ShareType.Vault>) => void;
    moveAll: (vault: ShareItem<ShareType.Vault>) => void;
};

export const VaultActionsContext = createContext<VaultActionsContextValue>({ delete: noop, moveAll: noop });
export const useVaultActions = () => useContext(VaultActionsContext);

export const VaultActionsProvider: FC = ({ children }) => {
    const dispatch = useDispatch();
    const { closeVaultSelect, openVaultSelect, modalState } = useVaultSelectModalHandles();
    const vaultRef = useRef<MaybeNull<ShareItem<ShareType.Vault>>>(null);

    const moveAllItems = useConfirm((destinationShareId: string) => {
        if (!vaultRef.current) return;
        dispatch(
            vaultMoveAllItemsIntent({
                content: vaultRef.current.content,
                destinationShareId,
                shareId: vaultRef.current.shareId,
            })
        );
    });

    const deleteVault = useConfirm(() => {
        if (!vaultRef.current) return;
        dispatch(
            vaultDeleteIntent({
                content: vaultRef.current.content,
                shareId: vaultRef.current.shareId,
            })
        );
    });

    const actions = useMemo<VaultActionsContextValue>(
        () => ({
            delete: (vault: ShareItem<ShareType.Vault>) => {
                vaultRef.current = vault;
                deleteVault.prompt();
            },
            moveAll: (vault: ShareItem<ShareType.Vault>) => {
                vaultRef.current = vault;
                openVaultSelect(vault.shareId, selectWritableVaultsWithItemsCount);
            },
        }),
        []
    );

    return (
        <VaultActionsContext.Provider value={actions}>
            {children}

            <VaultSelectModal
                downgradeMessage={c('Info')
                    .t`You have exceeded the number of vaults included in your subscription. Items can only be moved to your first two vaults. To move items between all vaults upgrade your subscription.`}
                onSubmit={(destinationShareId) => {
                    closeVaultSelect();
                    moveAllItems.prompt(destinationShareId);
                }}
                onClose={closeVaultSelect}
                description="Select where you want to move all items"
                {...modalState}
            />

            <VaultDeleteModal
                open={deleteVault.pending}
                vault={vaultRef.current}
                onClose={() => {
                    vaultRef.current = null;
                    deleteVault.cancel();
                }}
                onSubmit={() => deleteVault.confirm()}
            />

            <ConfirmationModal
                title={
                    // translator: variable here is the name of the vault: Move all items to "Work"?
                    c('Title').t`Move all items ?`
                }
                alertText={c('Info').t`Are you sure you want to move all items from XXX to YYYY ?`}
                open={moveAllItems.pending}
                onClose={moveAllItems.cancel}
                onSubmit={moveAllItems.confirm}
                submitText={c('Action').t`Move all items`}
            />
        </VaultActionsContext.Provider>
    );
};
