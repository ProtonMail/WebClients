import { type VFC, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
} from '@proton/components';
import { selectAllTrashedItems, selectShare, selectVaultsWithItemsCount } from '@proton/pass/store';
import { type MaybeNull, ShareRole, type ShareType, type VaultShare } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import type { VaultColor as VaultColorEnum } from '@proton/pass/types/protobuf/vault-v1';

import { useFeatureFlag } from '../../../shared/hooks/useFeatureFlag';
import { CountLabel } from '../Dropdown/CountLabel';
import { DropdownMenuButton } from '../Dropdown/DropdownMenuButton';
import { VaultIcon, type VaultIconName } from '../Vault/VaultIcon';

type VaultOption = 'all' | 'trash' | VaultShare;

const getVaultOptionInfo = (
    vault: VaultOption
): { id: null | string; label: string; path: string; color?: VaultColorEnum; icon?: VaultIconName } => {
    switch (vault) {
        case 'all':
            return { id: null, label: c('Label').t`All vaults`, path: '/' };
        case 'trash':
            return { id: null, label: c('Label').t`Trash`, path: '/trash', icon: 'pass-trash' };
        default:
            return {
                id: vault.shareId,
                label: vault.content.name,
                path: `/share/${vault.shareId}`,
                color: vault.content.display.color,
                icon: vault.content.display.icon,
            };
    }
};

type VaultItemProps = {
    share?: VaultShare;
    label: string;
    count: number;
    selected: boolean;
    onSelect: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onInvite?: () => void;
    onManage?: () => void;
    onLeave?: () => void;
    shared?: boolean;
};

const handleClickEvent = (handler?: () => void) => (evt: React.MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    handler?.();
};

export const VaultItem: VFC<VaultItemProps> = ({
    share,
    label,
    count,
    selected,
    onSelect,
    onDelete,
    onEdit,
    onInvite,
    onManage,
    onLeave,
    shared = false,
}) => {
    const withActions = onEdit || onDelete || onInvite || onManage || onLeave;
    const sharingEnabled = useFeatureFlag(PassFeature.PassSharingV1) && share !== undefined;

    return (
        <DropdownMenuButton
            onClick={() => onSelect()}
            isSelected={selected}
            label={<CountLabel label={label} count={count} />}
            extra={
                sharingEnabled &&
                shared && (
                    <ButtonLike
                        as="div"
                        icon
                        pill
                        size="small"
                        color="weak"
                        onClick={handleClickEvent(onManage)}
                        shape="ghost"
                        title={c('Action').t`See members`}
                    >
                        <Icon name="users" alt={c('Action').t`See members`} color="var(--text-weak)" />
                    </ButtonLike>
                )
            }
            icon={
                <VaultIcon
                    className="flex-item-noshrink"
                    size={16}
                    color={share?.content.display.color}
                    icon={share?.content.display.icon}
                />
            }
            quickActions={
                withActions && (
                    <>
                        {onEdit && share?.shareRoleId !== ShareRole.READ && (
                            <DropdownMenuButton
                                label={c('Action').t`Edit vault`}
                                icon="pen"
                                onClick={handleClickEvent(onEdit)}
                            />
                        )}

                        {sharingEnabled && shared && (
                            <DropdownMenuButton
                                className="flex flex-align-items-center py-2 px-4"
                                onClick={handleClickEvent(onManage)}
                                icon="users"
                                label={
                                    share.shareRoleId === ShareRole.ADMIN
                                        ? c('Action').t`Manage access`
                                        : c('Action').t`See members`
                                }
                            />
                        )}

                        {sharingEnabled && !shared && (
                            <DropdownMenuButton
                                className="flex flex-align-items-center py-2 px-4"
                                onClick={handleClickEvent(onInvite)}
                                icon="user-plus"
                                label={c('Action').t`Share`}
                            />
                        )}

                        {share?.owner && (
                            <DropdownMenuButton
                                disabled={!onDelete}
                                onClick={handleClickEvent(onDelete)}
                                label={c('Action').t`Delete vault`}
                                icon="trash"
                                danger
                            />
                        )}

                        {sharingEnabled && shared && !share.owner && (
                            <DropdownMenuButton
                                className="flex flex-align-items-center py-2 px-4"
                                onClick={handleClickEvent(onLeave)}
                                icon="cross-circle"
                                label={c('Action').t`Leave vault`}
                                danger
                            />
                        )}
                    </>
                )
            }
        />
    );
};

type TrashItemProps = {
    handleTrashRestore: () => void;
    handleTrashEmpty: () => void;
    onSelect: () => void;
    selected: boolean;
};
const TrashItem: VFC<TrashItemProps> = ({ onSelect, selected, handleTrashRestore, handleTrashEmpty }) => {
    const count = useSelector(selectAllTrashedItems).length;

    return (
        <DropdownMenuButton
            label={<CountLabel label={getVaultOptionInfo('trash').label} count={count} />}
            icon="trash"
            isSelected={selected}
            onClick={onSelect}
            quickActions={
                <>
                    <DropdownMenuButton
                        onClick={handleTrashRestore}
                        label={c('Label').t`Restore all items`}
                        icon="arrow-up-and-left"
                    />

                    <DropdownMenuButton
                        onClick={handleTrashEmpty}
                        label={c('Label').t`Empty trash`}
                        icon="trash-cross"
                        danger
                    />
                </>
            }
        />
    );
};

export const VaultSubmenu: VFC<{
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
}> = ({
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
    const vaults = useSelector(selectVaultsWithItemsCount);
    const selectedVault = useSelector(selectShare<ShareType.Vault>(selectedShareId ?? ''));

    const totalCount = useMemo(() => vaults.reduce<number>((subtotal, { count }) => subtotal + count, 0), [vaults]);

    const handleSelect = (vault: VaultOption) => {
        const { id, path } = getVaultOptionInfo(vault);
        handleVaultSelect(id);
        history.push(path);
    };

    const selectedVaultOption = getVaultOptionInfo(selectedVault || (inTrash ? 'trash' : 'all'));

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
                    const isPrimary = Boolean(vault.primary);
                    return (
                        <VaultItem
                            key={vault.shareId}
                            share={vault}
                            count={vault.count}
                            label={vault.content.name}
                            selected={!inTrash && selectedShareId === vault.shareId}
                            onSelect={() => handleSelect(vault)}
                            onDelete={!isPrimary ? () => handleVaultDelete(vault) : undefined}
                            onEdit={() => handleVaultEdit(vault)}
                            onInvite={() => handleVaultInvite(vault)}
                            onManage={() => handleVaultManage(vault)}
                            onLeave={() => handleVaultLeave(vault)}
                            shared={vault.shared}
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
