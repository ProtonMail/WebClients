import { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Icon } from '@proton/components';
import { useItemsActions } from '@proton/pass/components/Item/ItemActionsProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { UpsellRef } from '@proton/pass/constants';
import { useItemDrop } from '@proton/pass/hooks/useItemDrag';
import { intoBulkSelection } from '@proton/pass/lib/items/item.utils';
import { isVaultMemberLimitReached, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import { selectPassPlan } from '@proton/pass/store/selectors';
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
        const { moveMany } = useItemsActions();

        const spotlight = useSpotlight();
        const plan = useSelector(selectPassPlan);

        const withActions = canEdit || canDelete || canInvite || canManage || canLeave || canMove;

        const onSelect = pipe(() => vaultActions.select(vault.shareId), onAction);
        const onManage = pipe(() => vaultActions.manage(vault), onAction);
        const onEdit = pipe(() => vaultActions.edit(vault), onAction);
        const onInvite = pipe(() => vaultActions.invite(vault), onAction);
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
                onClick={() => !selected && onSelect()}
                label={<span className="block text-ellipsis">{label}</span>}
                parentClassName={clsx(
                    'pass-vault-submenu-vault-item w-full',
                    !withActions && 'pass-vault-submenu-vault-item--no-actions'
                )}
                className={clsx((selected || dragOver) && 'is-selected', !dense && 'py-3')}
                style={{ '--max-h-custom': '1.25rem' }}
                extra={
                    <>
                        {canManage && (
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
                                        size={3}
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
                        <span className="pass-vault--count shrink-0 color-weak mx-1">{count}</span>
                    </>
                }
                icon={
                    <VaultIcon
                        className="shrink-0"
                        size={3.5}
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
                                          plan === UserPassPlan.FREE && isVaultMemberLimitReached(vault)
                                              ? () =>
                                                    spotlight.setUpselling({
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
