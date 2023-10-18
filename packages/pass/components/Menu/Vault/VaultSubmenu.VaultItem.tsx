import { type VFC } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Icon } from '@proton/components';
import { isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { ShareRole, type VaultShare } from '@proton/pass/types';

import { CountLabel } from '../../Layout/Dropdown/CountLabel';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { VaultIcon } from '../../Vault/VaultIcon';

type Props = {
    count: number;
    label: string;
    selected: boolean;
    sharable?: boolean;
    share?: VaultShare;
    onDelete?: () => void;
    onEdit?: () => void;
    onInvite?: () => void;
    onLeave?: () => void;
    onManage?: () => void;
    onSelect: () => void;
};

const handleClickEvent = (handler?: () => void) => (evt: React.MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    handler?.();
};

export const VaultItem: VFC<Props> = ({
    count,
    label,
    selected,
    sharable = false,
    share,
    onDelete,
    onEdit,
    onInvite,
    onLeave,
    onManage,
    onSelect,
}) => {
    const withActions = onEdit || onDelete || onInvite || onManage || onLeave;
    const allowSharing = sharable && share !== undefined;
    const shared = share?.shared ?? false;

    return (
        <DropdownMenuButton
            onClick={() => onSelect()}
            isSelected={selected}
            label={<CountLabel label={label} count={count} />}
            extra={
                sharable &&
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
                        <DropdownMenuButton
                            disabled={!onEdit}
                            label={c('Action').t`Edit vault`}
                            icon="pen"
                            onClick={handleClickEvent(onEdit)}
                        />

                        {allowSharing && shared && (
                            <DropdownMenuButton
                                className="flex flex-align-items-center py-2 px-4"
                                disabled={!sharable}
                                icon="users"
                                label={
                                    share.shareRoleId === ShareRole.ADMIN
                                        ? c('Action').t`Manage access`
                                        : c('Action').t`See members`
                                }
                                onClick={handleClickEvent(onManage)}
                            />
                        )}

                        {allowSharing && !shared && (
                            <DropdownMenuButton
                                className="flex flex-align-items-center py-2 px-4"
                                disabled={!sharable || !isWritableVault(share)}
                                icon="user-plus"
                                label={c('Action').t`Share`}
                                onClick={handleClickEvent(onInvite)}
                            />
                        )}

                        {allowSharing && shared && !share.owner ? (
                            <DropdownMenuButton
                                className="flex flex-align-items-center py-2 px-4"
                                onClick={handleClickEvent(onLeave)}
                                icon="cross-circle"
                                label={c('Action').t`Leave vault`}
                                danger
                            />
                        ) : (
                            <DropdownMenuButton
                                disabled={!onDelete}
                                onClick={handleClickEvent(onDelete)}
                                label={c('Action').t`Delete vault`}
                                icon="trash"
                                danger
                            />
                        )}
                    </>
                )
            }
        />
    );
};
