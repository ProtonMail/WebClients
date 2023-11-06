import { type VFC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Icon } from '@proton/components';
import { useSpotlightContext } from '@proton/pass/components/Spotlight/SpotlightContext';
import { isVaultMemberLimitReached, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import { type ShareItem } from '@proton/pass/store/reducers';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import { ShareRole } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';

import { CountLabel } from '../../Layout/Dropdown/CountLabel';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { VaultIcon } from '../../Vault/VaultIcon';

type Props = {
    count: number;
    label: string;
    selected: boolean;
    sharable?: boolean;
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
    label,
    selected,
    sharable = false,
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
    const allowSharing = sharable && vault !== undefined;
    const shared = vault?.shared ?? false;
    const notification = (vault?.newUserInvitesReady ?? 0) > 0;
    const spotlight = useSpotlightContext();
    const plan = useSelector(selectPassPlan);

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
                )
            }
            icon={
                <VaultIcon
                    className="flex-item-noshrink"
                    size={16}
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
