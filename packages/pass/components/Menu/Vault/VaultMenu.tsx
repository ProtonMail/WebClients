import { type FC, type ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { VaultMenuAll } from '@proton/pass/components/Menu/Vault/VaultMenuAll';
import { VaultMenuItem } from '@proton/pass/components/Menu/Vault/VaultMenuItem';
import { VaultMenuTrash } from '@proton/pass/components/Menu/Vault/VaultMenuTrash';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useNavigationMatches } from '@proton/pass/components/Navigation/NavigationMatches';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import { isOwnVault, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { selectShare, selectVaultsWithItemsCount } from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { type VaultMenuOption, getVaultOptionInfo } from './utils';

import './VaultMenu.scss';

type Props = {
    dense?: boolean;
    onSelect: (selected: string) => void;
    onAction?: () => void;
    render?: (selectedVaultOption: VaultMenuOption, menu: ReactElement) => ReactElement;
};

export const VaultMenu: FC<Props> = ({ dense = false, onSelect, render, onAction = noop }) => {
    const { filters } = useNavigationFilters();
    const { selectedShareId } = filters;
    const { matchTrash: inTrash, matchItemList } = useNavigationMatches();

    const vaults = useSelector(selectVaultsWithItemsCount);
    const selectedVault = useSelector(selectShare<ShareType.Vault>(selectedShareId));

    const selectedVaultOption = getVaultOptionInfo(selectedVault || (inTrash ? 'trash' : 'all'));
    const vaultActions = useVaultActions();

    const menu = useMemo(() => {
        const totalItemCount = vaults.reduce<number>((subtotal, { count }) => subtotal + count, 0);
        const ownedVaultCount = vaults.filter(isOwnVault).length;

        return (
            <>
                <VaultMenuAll
                    count={totalItemCount}
                    dense={dense}
                    selected={matchItemList && !inTrash && !selectedShareId}
                    onAction={onAction}
                />

                {vaults.map((vault) => (
                    <VaultMenuItem
                        key={vault.shareId}
                        vault={vault}
                        count={vault.count}
                        label={vault.content.name}
                        selected={matchItemList && !inTrash && selectedShareId === vault.shareId}
                        canEdit={isShareManageable(vault)}
                        canMove={isWritableVault(vault) && vault.count > 0}
                        canDelete={vault.owner && ownedVaultCount > 1}
                        canInvite={!vault.shared}
                        canManage={vault.shared}
                        canLeave={vault.shared && !vault.owner}
                        dense={dense}
                        onAction={onAction}
                    />
                ))}

                <VaultMenuTrash dense={dense} selected={inTrash} onAction={onAction} />
            </>
        );
    }, [vaults, vaultActions, selectedShareId, inTrash, matchItemList, onSelect]);

    return render?.(selectedVaultOption, menu) ?? menu;
};
