import type { PropsWithChildren } from 'react';
import { type FC, type ReactElement, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Badge, DropdownSizeUnit, Icon } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { DropdownMenuLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuLabel';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { VaultTag } from '@proton/pass/components/Vault/VaultTag';
import { VAULT_ICON_MAP } from '@proton/pass/components/Vault/constants';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { UpsellRef } from '@proton/pass/constants';
import { useItemLoading } from '@proton/pass/hooks/useItemLoading';
import { isItemShared, isMonitored, isPinned, isTrashed, matchItemTypes } from '@proton/pass/lib/items/item.predicates';
import { isShareManageable, isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { itemPinRequest, itemUnpinRequest } from '@proton/pass/store/actions/requests';
import { selectAllVaults, selectPassPlan, selectRequestInFlight } from '@proton/pass/store/selectors';
import { BitField, type ItemType, ShareRole, SpotlightMessage } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { Panel } from './Panel';
import { PanelHeader } from './PanelHeader';

type Props = {
    /** extra actions visible on the panel header */
    actions?: ReactElement[];
    /** extra quick actions in the actions dropdown menu */
    quickActions?: ReactElement[];
    type: ItemType;
} & ItemViewProps;

export const ItemViewPanel: FC<PropsWithChildren<Props>> = ({
    actions = [],
    children,
    quickActions = [],
    revision,
    share,
    type,
    handleCloneClick,
    handleDeleteClick,
    handleDismissClick,
    handleEditClick,
    handleHistoryClick,
    handleLeaveItemClick,
    handleManageClick,
    handleMoveToTrashClick,
    handleMoveToVaultClick,
    handlePinClick,
    handleRestoreClick,
    handleRetryClick,
    handleSecureLinkClick,
    handleShareItemClick,
    handleToggleFlagsClick,
}) => {
    const upsell = useUpselling();
    const { spotlight } = usePassCore();

    const { shareId, itemId, data, optimistic, failed } = revision;
    const { name } = data.metadata;
    const trashed = isTrashed(revision);
    const pinned = isPinned(revision);
    const online = useConnectivity();
    const isVault = isVaultShare(share);

    const vaults = useSelector(selectAllVaults);
    const plan = useSelector(selectPassPlan);
    const monitored = isMonitored(revision);
    const loading = useItemLoading(revision);
    const actionsDisabled = loading || optimistic;

    const org = useOrganization();
    const orgItemSharingDisabled = org?.settings.ItemShareMode === BitField.DISABLED;

    const { shareRoleId, owner, targetMembers } = share;
    const itemShared = isItemShared(revision);
    /** Item is considered shared if either the revision
     * or the share are flagged as being shared. */
    const shared = itemShared || share.shared;

    const free = plan === UserPassPlan.FREE;
    const readOnly = shareRoleId === ShareRole.READ;
    const isOwnerOrManager = owner || shareRoleId === ShareRole.MANAGER;

    const hasMultipleVaults = vaults.length > 1;
    const canMove = (!shared || !readOnly) && hasMultipleVaults;

    const pinInFlight = useSelector(selectRequestInFlight(itemPinRequest(shareId, itemId)));
    const unpinInFlight = useSelector(selectRequestInFlight(itemUnpinRequest(shareId, itemId)));
    const canTogglePinned = !(pinInFlight || unpinInFlight);

    const accessCount = targetMembers + (revision.shareCount ?? 0);

    const canManage = isShareManageable(share);
    const canShare = canManage && type !== 'alias';
    const canLinkShare = canShare;
    const canItemShare = canShare && !orgItemSharingDisabled;
    const canManageAccess = shared && !readOnly;
    const canLeave = !isVault && !owner;
    const canMonitor = !EXTENSION_BUILD && !trashed && data.type === 'login' && !readOnly;

    const clonableTypes = useMemo<ItemType[]>(
        () => (free ? ['alias', 'creditCard', 'custom', 'sshKey', 'wifi'] : ['alias']),
        [free]
    );
    const canClone = canManage && !matchItemTypes(clonableTypes);

    const [signal, setSignalItemSharing] = useState(false);
    const signalItemSharing = signal && !itemShared && canItemShare;
    const disabledSharing = !(canItemShare || canLinkShare || canManageAccess);
    const showSharing = (owner || shared) && !readOnly;

    useEffect(() => {
        (async () => {
            const showSignal = await spotlight.check(SpotlightMessage.ITEM_SHARING);
            setSignalItemSharing(showSignal);
        })().catch(noop);
    }, []);

    const monitorActions = canMonitor && (
        <DropdownMenuButton
            disabled={actionsDisabled}
            onClick={handleToggleFlagsClick}
            icon={monitored ? 'eye-slash' : 'eye'}
            label={monitored ? c('Action').t`Exclude from monitoring` : c('Action').t`Include in monitoring`}
        />
    );

    /** Free user might have shared the vault - avoid upselling
     * from the `manage access` button in this case */
    const onManageItem =
        free && !share.shared
            ? () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.ITEM_SHARING })
            : handleManageClick;

    const onSecureLink = free
        ? () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.SECURE_LINKS })
        : handleSecureLinkClick;

    const onItemShare = free
        ? () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.ITEM_SHARING })
        : () => {
              void spotlight.acknowledge(SpotlightMessage.ITEM_SHARING);
              setSignalItemSharing(false);
              handleShareItemClick();
          };

    return (
        <Panel
            className={itemTypeToSubThemeClassName[type]}
            header={
                <PanelHeader
                    title={<h2 className="text-2xl text-bold text-ellipsis mb-0-5">{name}</h2>}
                    actions={(() => {
                        if (failed) {
                            return [
                                <Button
                                    key="dismiss-item-button"
                                    pill
                                    className="mr-1"
                                    color="danger"
                                    shape="outline"
                                    onClick={handleDismissClick}
                                >
                                    {c('Action').t`Dismiss`}
                                </Button>,
                                <Button key="retry-item-button" pill color="norm" onClick={handleRetryClick}>
                                    {c('Action').t`Retry`}
                                </Button>,
                            ];
                        }

                        if (trashed) {
                            return [
                                <QuickActionsDropdown
                                    key="item-quick-actions-dropdown"
                                    color="weak"
                                    shape="ghost"
                                    disabled={actionsDisabled}
                                >
                                    <DropdownMenuButton
                                        onClick={handleRestoreClick}
                                        label={c('Action').t`Restore item`}
                                        icon="arrows-rotate"
                                        disabled={readOnly}
                                    />

                                    <DropdownMenuButton
                                        onClick={handleDeleteClick}
                                        label={c('Action').t`Delete permanently`}
                                        icon="trash-cross"
                                        disabled={readOnly}
                                    />

                                    {canLeave && (
                                        <DropdownMenuButton
                                            onClick={handleLeaveItemClick}
                                            label={c('Action').t`Leave`}
                                            icon="arrow-out-from-rectangle"
                                        />
                                    )}

                                    {monitorActions}
                                </QuickActionsDropdown>,
                            ];
                        }

                        return [
                            <Button
                                className="flex text-sm"
                                key="edit-item-button"
                                pill
                                shape="solid"
                                color="weak"
                                onClick={handleEditClick}
                                disabled={actionsDisabled || readOnly}
                            >
                                <Icon name="pencil" className="mr-1" />
                                <span>{c('Action').t`Edit`}</span>
                            </Button>,

                            ...actions,

                            showSharing && (
                                <QuickActionsDropdown
                                    key="share-item-button"
                                    color="weak"
                                    shape="solid"
                                    pill
                                    icon="users-plus"
                                    menuClassName="flex flex-column"
                                    dropdownHeader={c('Label').t`Share`}
                                    disabled={!online || actionsDisabled || disabledSharing}
                                    badge={accessCount > 1 ? accessCount : undefined}
                                    signaled={isOwnerOrManager && signalItemSharing}
                                    dropdownSize={{
                                        height: DropdownSizeUnit.Dynamic,
                                        width: DropdownSizeUnit.Dynamic,
                                        maxHeight: DropdownSizeUnit.Viewport,
                                        maxWidth: '20rem',
                                    }}
                                >
                                    {canItemShare && (
                                        <DropdownMenuButton
                                            onClick={onItemShare}
                                            label={
                                                <DropdownMenuLabel
                                                    title={c('Action').t`With other ${BRAND_NAME} users`}
                                                    subtitle={c('Label').t`Useful for permanent sharing`}
                                                />
                                            }
                                            icon="user-plus"
                                            extra={
                                                (free && <PassPlusPromotionButton className="ml-2" />) ||
                                                (signalItemSharing && <Badge type="info">{c('Label').t`New`}</Badge>)
                                            }
                                        />
                                    )}

                                    {canLinkShare && (
                                        <DropdownMenuButton
                                            onClick={onSecureLink}
                                            label={
                                                <DropdownMenuLabel
                                                    title={c('Action').t`Via secure link`}
                                                    subtitle={c('Label').t`For a one-off sharing`}
                                                />
                                            }
                                            icon="link"
                                            extra={free && <PassPlusPromotionButton className="ml-2" />}
                                        />
                                    )}

                                    {canManageAccess && (
                                        <DropdownMenuButton
                                            onClick={onManageItem}
                                            title={c('Action').t`See members`}
                                            icon="users"
                                            label={
                                                <DropdownMenuLabel
                                                    title={c('Action').t`Manage access`}
                                                    subtitle={c('Label').t`See member and permission overview`}
                                                />
                                            }
                                        />
                                    )}
                                </QuickActionsDropdown>
                            ),

                            <QuickActionsDropdown
                                key="item-quick-actions-dropdown"
                                color="norm"
                                disabled={actionsDisabled}
                                shape="ghost"
                            >
                                {canMove && (
                                    <DropdownMenuButton
                                        onClick={handleMoveToVaultClick}
                                        label={c('Action').t`Move to another vault`}
                                        icon="folder-arrow-in"
                                    />
                                )}

                                {canClone && (
                                    <DropdownMenuButton
                                        onClick={handleCloneClick}
                                        label={c('Action').t`Clone item`}
                                        icon="squares"
                                        disabled={readOnly}
                                    />
                                )}

                                {quickActions}

                                <DropdownMenuButton
                                    onClick={handlePinClick}
                                    label={pinned ? c('Action').t`Unpin item` : c('Action').t`Pin item`}
                                    icon={pinned ? 'pin-angled-slash' : 'pin-angled'}
                                    disabled={!canTogglePinned}
                                    loading={!canTogglePinned}
                                />

                                {isPaidPlan(plan) && (
                                    <DropdownMenuButton
                                        onClick={handleHistoryClick}
                                        label={c('Action').t`View history`}
                                        icon={'clock-rotate-left'}
                                    />
                                )}

                                <DropdownMenuButton
                                    onClick={handleMoveToTrashClick}
                                    label={c('Action').t`Move to Trash`}
                                    icon="trash"
                                    disabled={readOnly}
                                />

                                {monitorActions}

                                {canLeave && (
                                    <DropdownMenuButton
                                        onClick={handleLeaveItemClick}
                                        label={c('Action').t`Leave`}
                                        icon="arrow-out-from-rectangle"
                                    />
                                )}
                            </QuickActionsDropdown>,
                        ];
                    })()}
                    subtitle={
                        isVault && hasMultipleVaults ? (
                            <VaultTag
                                title={share.content.name}
                                color={share.content.display.color}
                                icon={
                                    share.content.display.icon
                                        ? VAULT_ICON_MAP[share.content.display.icon]
                                        : 'pass-all-vaults'
                                }
                            />
                        ) : undefined
                    }
                />
            }
        >
            {children}
        </Panel>
    );
};
