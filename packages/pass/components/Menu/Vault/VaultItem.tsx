import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Icon } from '@proton/components';
import { useSpotlightContext } from '@proton/pass/components/Spotlight/SpotlightContext';
import { VAULT_COLOR_MAP } from '@proton/pass/components/Vault/constants';
import { isVaultMemberLimitReached, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { type ShareItem } from '@proton/pass/store/reducers';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import { ShareRole } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { VaultColor } from '@proton/pass/types/protobuf/vault-v1';
import clsx from '@proton/utils/clsx';

import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { VaultIcon } from '../../Vault/VaultIcon';

type Props = {
    count: number;
    dense?: boolean;
    label: string;
    selected: boolean;
    vault?: ShareItem<ShareType.Vault>;
    onDelete?: () => void;
    onEdit?: () => void;
    onInvite?: () => void;
    onLeave?: () => void;
    onManage?: () => void;
    onMove?: () => void;
    onSelect: () => void;
};

const handleClickEvent = (handler?: () => void) => (evt: React.MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    handler?.();
};

export const VaultItem: VFC<Props> = ({
    count,
    dense,
    label,
    selected,
    vault,
    onDelete,
    onEdit,
    onInvite,
    onLeave,
    onManage,
    onMove,
    onSelect,
}) => {
    const withActions = onEdit || onDelete || onInvite || onManage || onLeave;
    const allowSharing = vault !== undefined;
    const shared = vault?.shared ?? false;
    const notification = (vault?.newUserInvitesReady ?? 0) > 0;
    const spotlight = useSpotlightContext();
    const plan = useSelector(selectPassPlan);

    return (
        <DropdownMenuButton
            onClick={() => onSelect()}
            label={<span className="block text-ellipsis">{label}</span>}
            parentClassName={clsx(
                'pass-vault-submenu-vault-item w-full',
                selected && 'selected',
                !withActions && 'pass-vault-submenu-vault-item--no-actions'
            )}
            className={clsx(!dense && 'py-3')}
            style={{
                '--vault-icon-color': VAULT_COLOR_MAP[vault?.content.display.color ?? VaultColor.COLOR1],
            }}
            extra={
                <>
                    {shared && (
                        <ButtonLike
                            as="div"
                            icon
                            pill
                            size="small"
                            color="weak"
                            onClick={handleClickEvent(onManage)}
                            shape="ghost"
                            title={c('Action').t`See members`}
                            className="relative"
                        >
                            {notification && (
                                <Icon
                                    name="exclamation-circle-filled"
                                    size={12}
                                    className="absolute top-custom right-custom"
                                    style={{
                                        '--top-custom': '-1px',
                                        '--right-custom': '-1px',
                                        color: 'var(--signal-danger)',
                                    }}
                                />
                            )}
                            <Icon name="users" alt={c('Action').t`See members`} color="var(--text-weak)" />
                        </ButtonLike>
                    )}
                    <span className="pass-vault--count flex-item-noshrink color-weak mx-1">{count}</span>
                </>
            }
            icon={
                <VaultIcon
                    className="flex-item-noshrink"
                    size={14}
                    color={vault?.content.display.color}
                    icon={vault?.content.display.icon}
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
                                icon="users"
                                label={
                                    vault.shareRoleId === ShareRole.ADMIN
                                        ? c('Action').t`Manage access`
                                        : c('Action').t`See members`
                                }
                                onClick={handleClickEvent(onManage)}
                            />
                        )}

                        {allowSharing && !shared && (
                            <DropdownMenuButton
                                className="flex flex-align-items-center py-2 px-4"
                                disabled={!isWritableVault(vault)}
                                icon="user-plus"
                                label={c('Action').t`Share`}
                                onClick={
                                    plan === UserPassPlan.FREE && isVaultMemberLimitReached(vault)
                                        ? () => spotlight.setUpselling('pass-plus')
                                        : handleClickEvent(onInvite)
                                }
                            />
                        )}

                        {
                            <DropdownMenuButton
                                disabled={!onMove}
                                onClick={handleClickEvent(onMove)}
                                label={c('Action').t`Move all items`}
                                icon="folder-arrow-in"
                            />
                        }

                        {allowSharing && shared && !vault.owner ? (
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
