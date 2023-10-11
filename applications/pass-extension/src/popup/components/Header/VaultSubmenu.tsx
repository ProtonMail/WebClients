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
import { selectDefaultVault, selectShare, selectVaultsWithItemsCount } from '@proton/pass/store';
import { type MaybeNull, type ShareType, type VaultShare } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { isWritableVault } from '@proton/pass/utils/pass/share';

import { useFeatureFlag } from '../../../shared/hooks/useFeatureFlag';
import { VaultIcon } from '../Vault/VaultIcon';
import { TrashItem } from './VaultSubmenu.TrashItem';
import { VaultItem } from './VaultSubmenu.VaultItem';
import type { VaultOption } from './VaultSubmenu.utils';
import { getVaultOptionInfo } from './VaultSubmenu.utils';

type Props = {
    selectedShareId: MaybeNull<string>;
    inTrash: boolean;
    handleVaultSelect: (shareId: MaybeNull<string>) => void;
    handleVaultDelete: (vault: VaultShare) => void;
    handleVaultEdit: (vault: VaultShare) => void;
    handleVaultCreate: () => void;
    handleVaultInvite: (vault: VaultShare) => void;
    handleVaultManage: (vault: VaultShare) => void;
    handleVaultLeave: (vault: VaultShare) => void;
    handleTrashRestore: () => void;
    handleTrashEmpty: () => void;
};

export const VaultSubmenu: VFC<Props> = ({
    selectedShareId,
    inTrash,
    handleVaultSelect,
    handleVaultDelete,
    handleVaultEdit,
    handleVaultCreate,
    handleVaultInvite,
    handleVaultManage,
    handleVaultLeave,
    handleTrashRestore,
    handleTrashEmpty,
}) => {
    const history = useHistory();

    const sharingEnabled = useFeatureFlag(PassFeature.PassSharingV1);
    const primaryVaultDisabled = useFeatureFlag(PassFeature.PassRemovePrimaryVault);

    const vaults = useSelector(selectVaultsWithItemsCount);
    const defaultVault = useSelector(selectDefaultVault);
    const selectedVault = useSelector(selectShare<ShareType.Vault>(selectedShareId ?? ''));
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
                    const isDefaultOrPrimaryVault = defaultVault.shareId === vault.shareId;
                    const canDelete = vault.owner && !isDefaultOrPrimaryVault;
                    const sharable = sharingEnabled && (primaryVaultDisabled || !isDefaultOrPrimaryVault);

                    return (
                        <VaultItem
                            key={vault.shareId}
                            share={vault}
                            count={vault.count}
                            label={vault.content.name}
                            selected={!inTrash && selectedShareId === vault.shareId}
                            sharable={sharable}
                            onSelect={() => handleSelect(vault)}
                            onDelete={canDelete ? () => handleVaultDelete(vault) : undefined}
                            onEdit={isWritableVault(vault) ? () => handleVaultEdit(vault) : undefined}
                            onInvite={() => handleVaultInvite(vault)}
                            onManage={() => handleVaultManage(vault)}
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
