import { type FC, type ReactElement, useMemo } from 'react';
import { useSelector } from 'react-redux';

import noop from '@proton/utils/noop';

import { isShareManageable } from '../../../lib/shares/share.predicates';
import { isWritableVault } from '../../../lib/vaults/vault.predicates';
import { selectActiveSharedWithMeCount, selectShare, selectVisibleVaultsWithCount } from '../../../store/selectors';
import type { ShareType } from '../../../types';
import { useNavigationFilters } from '../../Navigation/NavigationFilters';
import { useItemScope } from '../../Navigation/NavigationMatches';
import { useVaultActions } from '../../Vault/VaultActionsProvider';
import { VaultMenuAll } from './VaultMenuAll';
import { VaultMenuItem } from './VaultMenuItem';
import { VaultMenuTrash } from './VaultMenuTrash';
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
    const totalSharedWithMe = useSelector(selectActiveSharedWithMeCount);

    const menu = useMemo(() => {
        const totalItems = vaults.reduce<number>((subtotal, { count }) => subtotal + count, 0) + totalSharedWithMe;

        return (
            <>
                <VaultMenuAll count={totalItems} selected={scope === 'share' && !selectedShareId} onAction={onAction} />

                {vaults.map((vault) => (
                    <VaultMenuItem
                        key={vault.shareId}
                        vault={vault}
                        count={vault.count}
                        label={vault.content.name}
                        selected={scope === 'share' && selectedShareId === vault.shareId}
                        canMove={isWritableVault(vault) && vault.count > 0}
                        canDelete={vault.owner}
                        canInvite={!vault.shared}
                        canManage={isShareManageable(vault)}
                        canLeave={vault.shared && !vault.owner && !vault.groupId}
                        onAction={onAction}
                    />
                ))}

                <VaultMenuTrash selected={scope === 'trash'} onAction={onAction} />
            </>
        );
    }, [vaults, vaultActions, selectedShareId, scope, totalSharedWithMe]);

    return render?.(selectedVaultOption, menu) ?? menu;
};
