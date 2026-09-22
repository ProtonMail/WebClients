import React, { memo, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Icon from '@proton/components/components/icon/Icon';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { UpsellRef } from '../../../constants';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { useItemDrop } from '../../../hooks/useItemDrag';
import { useMemoSelector } from '../../../hooks/useMemoSelector';
import { isMemberLimitReached } from '../../../lib/access/access.predicates';
import { intoBulkSelection } from '../../../lib/items/item.utils';
import { isWritableVault } from '../../../lib/vaults/vault.predicates';
import type { VaultShareItem } from '../../../store/reducers';
import { selectAccess, selectFolder, selectPassPlan, selectTopLevelFolders } from '../../../store/selectors';
import type { UniqueItem } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { UserPassPlan } from '../../../types/api/plan';
import { pipe } from '../../../utils/fp/pipe';
import { truthy } from '../../../utils/fp/predicates';
import { PassExpandButton } from '../../Folders/PassExpandButton';
import { PassSidebarFolder } from '../../Folders/PassSidebarFolder';
import { useFolderCreate } from '../../Folders/useFolderCreate';
import { useInviteActions } from '../../Invite/InviteProvider';
import { useItemsActions } from '../../Item/ItemActionsProvider';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { MaybeTooltip } from '../../Layout/Tooltip/MaybeTooltip';
import { useNavigationFilters } from '../../Navigation/NavigationFilters';
import { useUpselling } from '../../Upsell/UpsellingProvider';
import { useVaultActions } from '../../Vault/VaultActionsProvider';
import { VaultIcon } from '../../Vault/VaultIcon';

type Props = {
    canDelete: boolean;
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

type ShareButtonProps = {
    label: string;
    icon: IconName;
    action: (evt: React.MouseEvent) => void;
};

const handleClickEvent = (handler?: () => void) => (evt: React.MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();
    handler?.();
};

export const VaultMenuItem = memo(
    ({ canDelete, canInvite, canLeave, canManage, canMove, count, label, selected, vault, onAction = noop }: Props) => {
        const [isExpanded, setIsExpanded] = useState(false);

        const foldersEnabled = useFeatureFlag(PassFeature.PassFolder);
        const vaultActions = useVaultActions();
        const folderCreate = useFolderCreate(vault.shareId, null);
        const inviteActions = useInviteActions();
        const { moveMany } = useItemsActions();

        const upsell = useUpselling();
        const plan = useSelector(selectPassPlan);
        const access = useSelector(selectAccess(vault.shareId));
        const topLevelFolders = useMemoSelector(selectTopLevelFolders, [vault.shareId]);
        const showFolders = foldersEnabled && topLevelFolders.length > 0;

        const { filters } = useNavigationFilters();
        const hasSelectedFolder = Boolean(useSelector(selectFolder(vault.shareId, filters.selectedFolderId)));

        const withActions = canDelete || canInvite || canManage || canLeave || canMove;

        const onManage = pipe(() => inviteActions.manageVaultAccess(vault.shareId), onAction);
        const onEdit = pipe(() => vaultActions.edit(vault), onAction);
        const onInvite = pipe(() => inviteActions.createVaultInvite(vault.shareId), onAction);
        const onLeave = pipe(() => vaultActions.leave(vault), onAction);
        const onMove = pipe(() => vaultActions.moveItems(vault), onAction);
        const onDelete = pipe(() => vaultActions.delete(vault), onAction);
        const onCreateFolder = pipe(folderCreate.onCreate, onAction);

        const shareId = vault?.shareId;
        const notification = (vault?.newUserInvitesReady ?? 0) > 0;

        const dropParams = useMemo(() => {
            const onDrop = (items: UniqueItem[]) => shareId && moveMany(intoBulkSelection(items), shareId);
            const dragFilter = () => Boolean(vault && isWritableVault(vault));
            return [onDrop, dragFilter] as const;
        }, [vault]);

        const { dragOver, dragProps } = useItemDrop(...dropParams);

        /** Automatically expand this vault so the selected folder inside is visible */
        useEffect(() => {
            if (hasSelectedFolder) setIsExpanded(true);
        }, [hasSelectedFolder]);

        const onInviteClick =
            plan === UserPassPlan.FREE && isMemberLimitReached(vault, access)
                ? () =>
                      upsell({
                          type: 'pass-plus',
                          upsellRef: UpsellRef.LIMIT_SHARING,
                      })
                : handleClickEvent(onInvite);

        const shareButton = ((): ShareButtonProps => {
            const opensInvite = !vault.shared;

            const label = (() => {
                if (opensInvite) return c('Action').t`Share`;
                return canManage ? c('Action').t`Manage access` : c('Action').t`See members`;
            })();

            const icon = opensInvite ? 'user-plus' : 'users';
            const action = opensInvite ? onInviteClick : handleClickEvent(onManage);

            return { label, icon, action };
        })();

        return (
            <>
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
                    className={clsx((selected || dragOver) && 'is-selected', 'pl-2 pr-2 group-hover-opacity-container')}
                    extra={
                        <>
                            {folderCreate.canShow && isWritableVault(vault) && (
                                <MaybeTooltip active={folderCreate.limitReached} title={folderCreate.limitReason}>
                                    <ButtonLike
                                        as="div"
                                        pill
                                        icon
                                        size="small"
                                        color="weak"
                                        disabled={folderCreate.limitReached}
                                        onClick={
                                            folderCreate.limitReached ? undefined : handleClickEvent(onCreateFolder)
                                        }
                                        shape="solid"
                                        title={folderCreate.limitReached ? undefined : c('Action').t`Create folder`}
                                        className={clsx(
                                            !selected && 'group-hover:opacity-100 group-hover:opacity-100-no-width',
                                            'relative mr-1'
                                        )}
                                        style={{ color: 'var(--text-weak)' }}
                                    >
                                        <Icon name="folder-plus" />
                                    </ButtonLike>
                                </MaybeTooltip>
                            )}
                            <ButtonLike
                                as="div"
                                pill
                                icon={vault.targetMembers <= 1}
                                size="small"
                                color="weak"
                                onClick={shareButton.action}
                                shape="solid"
                                title={shareButton.label}
                                className={clsx(
                                    !(selected || vault.shared) &&
                                        'group-hover:opacity-100 group-hover:opacity-100-no-width',
                                    'relative mr-3'
                                )}
                                style={{ color: 'var(--text-weak)' }}
                            >
                                {notification && (
                                    <IcExclamationCircleFilled
                                        size={4}
                                        className="absolute top-custom right-custom"
                                        style={{
                                            '--top-custom': '-1px',
                                            '--right-custom': '-1px',
                                            color: 'var(--signal-danger)',
                                        }}
                                    />
                                )}
                                <Icon name={shareButton.icon} />
                                {vault.targetMembers > 1 && <span className="text-sm ml-1">{vault.targetMembers}</span>}
                            </ButtonLike>
                        </>
                    }
                    extraClassname="pr-4"
                    icon={
                        <>
                            <PassExpandButton
                                expanded={isExpanded}
                                onClick={() => setIsExpanded(!isExpanded)}
                                hidden={!showFolders}
                            />
                            <VaultIcon
                                background
                                className="shrink-0 mr-1"
                                size={4}
                                color={vault?.content.display.color}
                                icon={vault?.content.display.icon}
                            />
                        </>
                    }
                    quickActions={
                        withActions
                            ? [
                                  canManage && (
                                      <DropdownMenuButton
                                          key="vault-edit"
                                          label={c('Action').t`Edit vault`}
                                          icon="pen"
                                          onClick={handleClickEvent(onEdit)}
                                      />
                                  ),

                                  folderCreate.canShow && (
                                      <DropdownMenuButton
                                          key="folder-create"
                                          disabled={!isWritableVault(vault) || folderCreate.limitReached}
                                          title={folderCreate.limitReason ?? undefined}
                                          label={c('Action').t`Create folder`}
                                          icon="folder-plus"
                                          onClick={handleClickEvent(onCreateFolder)}
                                      />
                                  ),

                                  vault.shared && (
                                      <DropdownMenuButton
                                          key="vault-manage"
                                          className="flex items-center py-2 px-4"
                                          icon="users"
                                          label={canManage ? c('Action').t`Manage access` : c('Action').t`See members`}
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
                                          onClick={onInviteClick}
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
                {isExpanded && showFolders && (
                    <ul className="unstyled my-1 w-full">
                        {topLevelFolders.map((folder) => (
                            <PassSidebarFolder
                                key={folder.folderId}
                                folderId={folder.folderId}
                                shareId={folder.shareId}
                                name={folder.name}
                                onAction={onAction}
                            />
                        ))}
                    </ul>
                )}
            </>
        );
    }
);

VaultMenuItem.displayName = 'VaultMenuItemMemo';
