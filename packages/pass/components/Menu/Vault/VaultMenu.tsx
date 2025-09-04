import { type FC, type ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { VaultMenuAll } from '@proton/pass/components/Menu/Vault/VaultMenuAll';
import { VaultMenuItem } from '@proton/pass/components/Menu/Vault/VaultMenuItem';
import { VaultMenuTrash } from '@proton/pass/components/Menu/Vault/VaultMenuTrash';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import { isOwnVault, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { selectActiveSharedWithMeCount, selectShare, selectVisibleVaultsWithCount } from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { type VaultMenuOption, getVaultOptionInfo } from './utils';

import './VaultMenu.scss';

type Props = {
    onAction?: () => void;
    render?: (selectedVaultOption: VaultMenuOption, menu: ReactElement) => ReactElement;
};

export const VaultMenu: FC<Props> = ({ render, onAction = noop }) => {
    const { filters } = useNavigationFilters();
    const { selectedShareId } = filters;
    const scope = useItemScope();
    const inTrash = scope === 'trash';

    const vaults = useSelector(selectVisibleVaultsWithCount);
    const selectedVault = useSelector(selectShare<ShareType.Vault>(selectedShareId));

    const selectedVaultOption = getVaultOptionInfo(selectedVault || (inTrash ? 'trash' : 'all'));
    const vaultActions = useVaultActions();
    const activeSharedItemCount = useSelector(selectActiveSharedWithMeCount);

    const menu = useMemo(() => {
        const totalItemCount =
            vaults.reduce<number>((subtotal, { count }) => subtotal + count, 0) + activeSharedItemCount;
        const ownedVaultCount = vaults.filter(isOwnVault).length;

        return (
            <>
                <VaultMenuAll
                    count={totalItemCount}
                    selected={scope === 'share' && !selectedShareId}
                    onAction={onAction}
                />

                {vaults.map((vault) => (
                    <VaultMenuItem
                        key={vault.shareId}
                        vault={vault}
                        count={vault.count}
                        label={vault.content.name}
                        selected={scope === 'share' && selectedShareId === vault.shareId}
                        canEdit={isShareManageable(vault)}
                        canMove={isWritableVault(vault) && vault.count > 0}
                        canDelete={vault.owner && ownedVaultCount > 1}
                        canInvite={!vault.shared}
                        canManage={isShareManageable(vault)}
                        canLeave={vault.shared && !vault.owner}
                        onAction={onAction}
                    />
                ))}

                <VaultMenuTrash selected={scope === 'trash'} onAction={onAction} />
            </>
        );
    }, [vaults, vaultActions, selectedShareId, scope, activeSharedItemCount]);

    return render?.(selectedVaultOption, menu) ?? menu;
};
