import { type VFC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import { selectOwnVaults, selectShare, selectVaultsWithItemsCount } from '@proton/pass/store/selectors';
import type { MaybeNull, ShareType } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { VaultIcon } from '../../Vault/VaultIcon';
import { TrashItem } from './VaultSubmenu.TrashItem';
import { VaultItem } from './VaultSubmenu.VaultItem';
import type { VaultOption } from './VaultSubmenu.utils';
import { getVaultOptionInfo } from './VaultSubmenu.utils';

type Props = {
    inTrash: boolean;
    selectedShareId: MaybeNull<string>;
    handleTrashEmpty: () => void;
    handleTrashRestore: () => void;
    handleVaultCreate: () => void;
    handleVaultDelete: (vault: VaultShareItem) => void;
    handleVaultEdit: (vault: VaultShareItem) => void;
    handleVaultInvite: (vault: VaultShareItem) => void;
    handleVaultLeave: (vault: VaultShareItem) => void;
    handleVaultManage: (vault: VaultShareItem) => void;
    handleVaultMoveAllItems: (vault: VaultShareItem) => void;
    handleVaultSelect: (shareId: MaybeNull<string>) => void;
};

export const VaultSubmenu: VFC<Props> = ({
    inTrash,
    selectedShareId,
    handleTrashEmpty,
    handleTrashRestore,
    handleVaultCreate,
    handleVaultDelete,
    handleVaultEdit,
    handleVaultInvite,
    handleVaultLeave,
    handleVaultManage,
    handleVaultMoveAllItems,
    handleVaultSelect,
}) => {
    const history = useHistory();

    const sharingEnabled = useFeatureFlag(PassFeature.PassSharingV1);

    const vaults = useSelector(selectVaultsWithItemsCount);
    const selectedVault = useSelector(selectShare<ShareType.Vault>(selectedShareId ?? ''));
    const hasMultipleOwnVaults = useSelector(selectOwnVaults).length > 1;

    const selectedVaultOption = getVaultOptionInfo(selectedVault || (inTrash ? 'trash' : 'all'));
    const totalCount = useMemo(() => vaults.reduce<number>((subtotal, { count }) => subtotal + count, 0), [vaults]);

    const handleSelect = (vault: VaultOption) => {
        const { id, path } = getVaultOptionInfo(vault);
        handleVaultSelect(id);
        history.push(path);
    };

    return (
        <Collapsible>
            <CollapsibleHeader
                className="pl-4 pr-2"
                suffix={
                    <CollapsibleHeaderIconButton className="p-0" pill size="small">
                        <Icon name="chevron-down" />
                    </CollapsibleHeaderIconButton>
                }
            >
                <span className="flex flex-align-items-center flex-nowrap gap-2">
                    <VaultIcon
                        className="flex-item-noshrink"
                        size={16}
                        color={selectedVaultOption?.color}
                        icon={selectedVaultOption?.icon}
                    />
                    <span className="block text-ellipsis">{selectedVaultOption.label}</span>
                </span>
            </CollapsibleHeader>
            <CollapsibleContent as="ul" className="unstyled">
                <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                <VaultItem
                    label={getVaultOptionInfo('all').label}
                    count={totalCount}
                    selected={!inTrash && selectedShareId === null}
                    onSelect={() => handleSelect('all')}
                />

                {vaults.map((vault) => {
                    const canEdit = isShareManageable(vault);
                    const canDelete = vault.owner && hasMultipleOwnVaults;

                    return (
                        <VaultItem
                            key={vault.shareId}
                            vault={vault}
                            count={vault.count}
                            label={vault.content.name}
                            selected={!inTrash && selectedShareId === vault.shareId}
                            sharable={sharingEnabled}
                            onSelect={() => handleSelect(vault)}
                            onDelete={canDelete ? () => handleVaultDelete(vault) : undefined}
                            onEdit={canEdit ? () => handleVaultEdit(vault) : undefined}
                            onInvite={() => handleVaultInvite(vault)}
                            onManage={() => handleVaultManage(vault)}
                            onMove={canEdit && vault.count > 0 ? () => handleVaultMoveAllItems(vault) : undefined}
                            onLeave={() => handleVaultLeave(vault)}
                        />
                    );
                })}

                <TrashItem
                    handleTrashRestore={handleTrashRestore}
                    handleTrashEmpty={handleTrashEmpty}
                    onSelect={() => handleSelect('trash')}
                    selected={inTrash}
                />

                <div className="px-2 mt-2 mb-4">
                    <Button className="w-full" color="weak" shape="solid" onClick={handleVaultCreate}>
                        {c('Action').t`Create vault`}
                    </Button>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
