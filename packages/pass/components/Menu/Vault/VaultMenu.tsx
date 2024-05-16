import { type FC, type ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { TrashItem } from '@proton/pass/components/Menu/Vault/TrashItem';
import { VaultItem } from '@proton/pass/components/Menu/Vault/VaultItem';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import { isOwnVault, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { selectShare, selectVaultsWithItemsCount } from '@proton/pass/store/selectors';
import type { MaybeNull, ShareType } from '@proton/pass/types';
import { withTap } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

import { type VaultMenuOption, getVaultOptionInfo } from './utils';

import './VaultMenu.scss';

type Props = {
    dense?: boolean;
    inTrash: boolean;
    selectedShareId: MaybeNull<string>;
    onSelect: (selected: string) => void;
    onAction?: () => void;
    render?: (selectedVaultOption: VaultMenuOption, menu: ReactElement) => ReactElement;
};

export const VaultMenu: FC<Props> = ({
    dense = false,
    inTrash,
    selectedShareId,
    onSelect,
    render,
    onAction = noop,
}) => {
    const vaults = useSelector(selectVaultsWithItemsCount);
    const selectedVault = useSelector(selectShare<ShareType.Vault>(selectedShareId));
    const selectedVaultOption = getVaultOptionInfo(selectedVault || (inTrash ? 'trash' : 'all'));
    const vaultActions = useVaultActions();

    const menu = useMemo(() => {
        const withAction = withTap(onAction);
        const totalItemCount = vaults.reduce<number>((subtotal, { count }) => subtotal + count, 0);
        const ownedVaultCount = vaults.filter(isOwnVault).length;

        return (
            <>
                <VaultItem
                    label={getVaultOptionInfo('all').label}
                    count={totalItemCount}
                    selected={!inTrash && !selectedShareId}
                    onSelect={withAction(() => onSelect('all'))}
                    dense={dense}
                />

                {vaults.map((vault) => {
                    const canEdit = isShareManageable(vault);
                    const canMove = isWritableVault(vault) && vault.count > 0;
                    const canDelete = vault.owner && ownedVaultCount > 1;

                    return (
                        <VaultItem
                            key={vault.shareId}
                            vault={vault}
                            count={vault.count}
                            label={vault.content.name}
                            selected={!inTrash && selectedShareId === vault.shareId}
                            onSelect={withAction(() => onSelect(vault.shareId))}
                            onDelete={canDelete ? withAction(() => vaultActions.delete(vault)) : undefined}
                            onEdit={canEdit ? withAction(() => vaultActions.edit(vault)) : undefined}
                            onInvite={withAction(() => vaultActions.invite(vault))}
                            onManage={withAction(() => vaultActions.manage(vault))}
                            onMove={canMove ? withAction(() => vaultActions.moveItems(vault)) : undefined}
                            onLeave={withAction(() => vaultActions.leave(vault))}
                            dense={dense}
                        />
                    );
                })}

                <TrashItem
                    handleTrashRestore={withAction(vaultActions.trashRestore)}
                    handleTrashEmpty={withAction(vaultActions.trashEmpty)}
                    onSelect={withAction(() => onSelect('trash'))}
                    selected={inTrash}
                    dense={dense}
                />
            </>
        );
    }, [vaults, vaultActions, selectedShareId, inTrash, onSelect]);

    return render?.(selectedVaultOption, menu) ?? menu;
};
