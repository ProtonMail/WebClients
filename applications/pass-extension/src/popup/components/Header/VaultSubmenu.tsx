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
import { selectAllTrashedItems, selectAllVaultWithItemsCount, selectShare } from '@proton/pass/store';
import type { MaybeNull, ShareType, VaultShare } from '@proton/pass/types';
import type { VaultColor as VaultColorEnum } from '@proton/pass/types/protobuf/vault-v1';

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
};

const handleClickEvent = (handler: () => void) => (evt: React.MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    handler();
};

export const VaultItem: VFC<VaultItemProps> = ({ share, label, count, selected, onSelect, onDelete, onEdit }) => {
    const withActions = onEdit || onDelete;

    return (
        <DropdownMenuButton
            className="flex flex-align-items-center py-2 px-4"
            onClick={() => onSelect()}
            isSelected={selected}
            quickActions={
                withActions && (
                    <>
                        {onEdit && (
                            <DropdownMenuButton
                                className="flex flex-align-items-center py-2 px-4"
                                onClick={onEdit ? (evt) => handleClickEvent(onEdit)(evt) : undefined}
                            >
                                <Icon name="pen" className="mr-3 color-weak" />
                                {c('Action').t`Edit vault`}
                            </DropdownMenuButton>
                        )}
                        <DropdownMenuButton
                            className="flex flex-align-items-center py-2 px-4"
                            disabled={!onDelete}
                            onClick={onDelete ? handleClickEvent(onDelete) : undefined}
                        >
                            <Icon name="trash" className="mr-3 color-weak" />
                            {c('Action').t`Delete vault`}
                        </DropdownMenuButton>
                    </>
                )
            }
        >
            <VaultIcon
                className="flex-item-noshrink mr-3"
                size="medium"
                color={share?.content.display.color}
                icon={share?.content.display.icon}
            />
            <span className="text-ellipsis inline-block max-w100">{label}</span>
            <span className="color-weak ml-1 inline-block">({count})</span>
        </DropdownMenuButton>
    );
};

type TrashItemProps = {
    handleRestoreTrash: () => void;
    handleEmptyTrash: () => void;
    onSelect: () => void;
    selected: boolean;
};
const TrashItem: VFC<TrashItemProps> = ({ onSelect, selected, handleRestoreTrash, handleEmptyTrash }) => {
    const count = useSelector(selectAllTrashedItems).length;

    return (
        <DropdownMenuButton
            className="flex flex-align-items-center py-2 px-4"
            isSelected={selected}
            onClick={onSelect}
            quickActions={
                <>
                    <DropdownMenuButton className="flex flex-align-items-center py-2 px-4" onClick={handleRestoreTrash}>
                        <Icon name="arrow-up-and-left" className="mr-1" />
                        {c('Label').t`Restore all items`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="flex flex-align-items-center py-2 px-4 color-danger"
                        onClick={handleEmptyTrash}
                    >
                        <Icon name="trash-cross" className="mr-1" />
                        {c('Label').t`Empty trash`}
                    </DropdownMenuButton>
                </>
            }
        >
            <Icon name="trash" className="color-weak mr-3" />
            {getVaultOptionInfo('trash').label}
            <span className="color-weak ml-1 inline-block">({count})</span>
        </DropdownMenuButton>
    );
};

export const VaultSubmenu: VFC<{
    selectedShareId: MaybeNull<string>;
    inTrash: boolean;
    handleVaultSelectClick: (shareId: MaybeNull<string>) => void;
    handleVaultDeleteClick: (vault: VaultShare) => void;
    handleVaultEditClick: (vault: VaultShare) => void;
    handleVaultCreateClick: () => void;
    handleRestoreTrash: () => void;
    handleEmptyTrash: () => void;
}> = ({
    selectedShareId,
    inTrash,
    handleVaultSelectClick,
    handleVaultDeleteClick,
    handleVaultEditClick,
    handleVaultCreateClick,
    handleRestoreTrash,
    handleEmptyTrash,
}) => {
    const history = useHistory();
    const vaults = useSelector(selectAllVaultWithItemsCount);
    const selectedVault = useSelector(selectShare<ShareType.Vault>(selectedShareId ?? ''));

    const totalCount = useMemo(() => vaults.reduce<number>((subtotal, { count }) => subtotal + count, 0), [vaults]);

    const handleSelect = (vault: VaultOption) => {
        const { id, path } = getVaultOptionInfo(vault);
        handleVaultSelectClick(id);
        history.push(path);
    };

    const selectedVaultOption = getVaultOptionInfo(selectedVault || (inTrash ? 'trash' : 'all'));

    return (
        <Collapsible>
            <CollapsibleHeader
                className="pl-4 pr-2"
                suffix={
                    <CollapsibleHeaderIconButton className="p-0" pill>
                        <Icon name="chevron-down" />
                    </CollapsibleHeaderIconButton>
                }
            >
                <span className="flex flex-align-items-center">
                    <VaultIcon
                        className="mr-3"
                        size="medium"
                        color={selectedVaultOption?.color}
                        icon={selectedVaultOption?.icon}
                    />
                    {selectedVaultOption.label}
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
                            onDelete={!isPrimary ? () => handleVaultDeleteClick(vault) : undefined}
                            onEdit={() => handleVaultEditClick(vault)}
                        />
                    );
                })}

                <TrashItem
                    handleRestoreTrash={handleRestoreTrash}
                    handleEmptyTrash={handleEmptyTrash}
                    onSelect={() => handleSelect('trash')}
                    selected={inTrash}
                />

                <div className="px-2 mt-2 mb-4">
                    <Button className="w100" color="weak" shape="solid" onClick={handleVaultCreateClick}>
                        {c('Action').t`Create vault`}
                    </Button>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
