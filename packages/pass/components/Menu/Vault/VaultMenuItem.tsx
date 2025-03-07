import { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Icon } from '@proton/components';
import { useInviteActions } from '@proton/pass/components/Invite/InviteProvider';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { UpsellRef } from '@proton/pass/constants';
import { useItemDrop } from '@proton/pass/hooks/useItemDrag';
import { isMemberLimitReached } from '@proton/pass/lib/access/access.predicates';
import { intoBulkSelection } from '@proton/pass/lib/items/item.utils';
import { isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import { selectAccess, selectPassPlan } from '@proton/pass/store/selectors';
import type { UniqueItem } from '@proton/pass/types';
import { ShareRole } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { truthy } from '@proton/pass/utils/fp/predicates';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

type Props = {
    canDelete: boolean;
    canEdit: boolean;
    canInvite: boolean;
    canLeave: boolean;
    canManage: boolean;
    canMove: boolean;
    count: number;
    dense?: boolean;
    label: string;
    selected: boolean;
    vault: VaultShareItem;
    onAction?: () => void;
};

const handleClickEvent = (handler?: () => void) => (evt: React.MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    handler?.();
};

export const VaultMenuItem = memo(
    ({
        canDelete,
        canEdit,
        canInvite,
        canLeave,
        canManage,
        canMove,
        count,
        dense,
        label,
        selected,
        vault,
        onAction = noop,
    }: Props) => {
        const vaultActions = useVaultActions();
        const inviteActions = useInviteActions();
        const { moveMany } = useItemsActions();

        const upsell = useUpselling();
        const plan = useSelector(selectPassPlan);
        const access = useSelector(selectAccess(vault.shareId));

        const withActions = canEdit || canDelete || canInvite || canManage || canLeave || canMove;

        const onManage = pipe(() => inviteActions.manageVaultAccess(vault.shareId), onAction);
        const onEdit = pipe(() => vaultActions.edit(vault), onAction);
        const onInvite = pipe(() => inviteActions.createVaultInvite(vault.shareId), onAction);
        const onLeave = pipe(() => vaultActions.leave(vault), onAction);
        const onMove = pipe(() => vaultActions.moveItems(vault), onAction);
        const onDelete = pipe(() => vaultActions.delete(vault), onAction);

        const shareId = vault?.shareId;
        const notification = (vault?.newUserInvitesReady ?? 0) > 0;

        const dropParams = useMemo(() => {
            const onDrop = (items: UniqueItem[]) => shareId && moveMany(intoBulkSelection(items), shareId);
            const dragFilter = () => Boolean(vault && isWritableVault(vault));
            return [onDrop, dragFilter] as const;
        }, [vault]);

        const { dragOver, dragProps } = useItemDrop(...dropParams);

        return (
            <DropdownMenuButton
                onClick={pipe(() => !selected && vaultActions.select(vault.shareId), onAction)}
                label={
                    <div>
                        <div className="text-ellipsis">{label}</div>
                        <div className="color-weak">
                            {c('Label').ngettext(msgid`${count} item`, `${count} items`, count)}
                        </div>
                    </div>
                }
                parentClassName={clsx(
                    'pass-vault-submenu-vault-item w-full',
                    !withActions && 'pass-vault-submenu-vault-item--no-actions'
                )}
                className={clsx((selected || dragOver) && 'is-selected', !dense && 'py-2')}
                extra={
                    vault.shared &&
                    canManage && (
                        <ButtonLike
                            as="div"
                            pill
                            size="small"
                            color="weak"
                            onClick={handleClickEvent(onManage)}
                            shape="solid"
                            title={c('Action').t`See members`}
                            className="relative mr-1"
                            style={{ color: 'var(--text-weak)' }}
                        >
                            {notification && (
                                <Icon
                                    name="exclamation-circle-filled"
                                    size={4}
                                    className="absolute top-custom right-custom"
                                    style={{
                                        '--top-custom': '-1px',
                                        '--right-custom': '-1px',
                                        color: 'var(--signal-danger)',
                                    }}
                                />
                            )}
                            <Icon name="users" alt={c('Action').t`See members`} />
                            {vault.targetMembers > 1 && <span className="text-sm ml-1">{vault.targetMembers}</span>}
                        </ButtonLike>
                    )
                }
                icon={
                    <VaultIcon
                        background
                        className="shrink-0"
                        size={4}
                        color={vault?.content.display.color}
                        icon={vault?.content.display.icon}
                    />
                }
                quickActions={
                    withActions
                        ? [
                              <DropdownMenuButton
                                  key="vault-edit"
                                  disabled={!onEdit}
                                  label={c('Action').t`Edit vault`}
                                  icon="pen"
                                  onClick={handleClickEvent(onEdit)}
                              />,

                              canManage && (
                                  <DropdownMenuButton
                                      key="vault-manage"
                                      className="flex items-center py-2 px-4"
                                      icon="users"
                                      label={
                                          vault.shareRoleId === ShareRole.ADMIN
                                              ? c('Action').t`Manage access`
                                              : c('Action').t`See members`
                                      }
                                      onClick={handleClickEvent(onManage)}
                                  />
                              ),

                              canInvite && (
                                  <DropdownMenuButton
                                      key="vault-share"
                                      className="flex items-center py-2 px-4"
                                      disabled={!isWritableVault(vault)}
                                      icon="user-plus"
                                      label={c('Action').t`Share`}
                                      onClick={
                                          plan === UserPassPlan.FREE && isMemberLimitReached(vault, access)
                                              ? () =>
                                                    upsell({
                                                        type: 'pass-plus',
                                                        upsellRef: UpsellRef.LIMIT_SHARING,
                                                    })
                                              : handleClickEvent(onInvite)
                                      }
                                  />
                              ),

                              canMove && (
                                  <DropdownMenuButton
                                      key="vault-move"
                                      onClick={handleClickEvent(onMove)}
                                      label={c('Action').t`Move all items`}
                                      icon="folder-arrow-in"
                                  />
                              ),

                              canLeave && (
                                  <DropdownMenuButton
                                      key="vault-leave"
                                      className="flex items-center py-2 px-4"
                                      onClick={handleClickEvent(onLeave)}
                                      icon="cross-circle"
                                      label={c('Action').t`Leave vault`}
                                      danger
                                  />
                              ),

                              canDelete && (
                                  <DropdownMenuButton
                                      key="vault-delete"
                                      disabled={!onDelete}
                                      onClick={handleClickEvent(onDelete)}
                                      label={c('Action').t`Delete vault`}
                                      icon="trash"
                                      danger
                                  />
                              ),
                          ].filter(truthy)
                        : undefined
                }
                {...dragProps}
            />
        );
    }
);

VaultMenuItem.displayName = 'VaultMenuItemMemo';
