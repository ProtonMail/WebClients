import type { PropsWithChildren } from 'react';
import { type FC, type ReactElement, useEffect, useState } from 'react';
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
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { VaultTag } from '@proton/pass/components/Vault/VaultTag';
import { VAULT_ICON_MAP } from '@proton/pass/components/Vault/constants';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { UpsellRef } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { isMonitored, isPinned, isShared, isTrashed } from '@proton/pass/lib/items/item.predicates';
import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { itemPinRequest, itemUnpinRequest } from '@proton/pass/store/actions/requests';
import { selectAllVaults, selectPassPlan, selectRequestInFlight } from '@proton/pass/store/selectors';
import { type ItemType, ShareRole, SpotlightMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
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

    const { shareId, itemId, data, optimistic, failed, shareCount } = revision;
    const { name } = data.metadata;
    const trashed = isTrashed(revision);
    const pinned = isPinned(revision);
    const online = useConnectivity();
    const isVault = isVaultShare(share);

    const vaults = useSelector(selectAllVaults);
    const plan = useSelector(selectPassPlan);
    const monitored = isMonitored(revision);

    const { shareRoleId, owner, targetMembers } = share;
    const shared = isShared(revision);
    const free = plan === UserPassPlan.FREE;
    const readOnly = shareRoleId === ShareRole.READ;
    const isOwnerOrAdmin = owner || shareRoleId === ShareRole.ADMIN;
    const sharedReadOnly = shared && readOnly;
    const hasMultipleVaults = vaults.length > 1;
    const canMove = (!shared || owner) && hasMultipleVaults;

    const pinInFlight = useSelector(selectRequestInFlight(itemPinRequest(shareId, itemId)));
    const unpinInFlight = useSelector(selectRequestInFlight(itemUnpinRequest(shareId, itemId)));
    const canTogglePinned = !(pinInFlight || unpinInFlight);

    const [signal, setSignalItemSharing] = useState(false);
    const signalItemSharing = signal && !shared;

    useEffect(() => {
        (async () => {
            const showSignal = await spotlight.check(SpotlightMessage.ITEM_SHARING);
            setSignalItemSharing(showSignal);
        })().catch(noop);
    }, []);

    const monitorActions = !EXTENSION_BUILD && !trashed && data.type === 'login' && (
        <DropdownMenuButton
            disabled={optimistic}
            onClick={handleToggleFlagsClick}
            icon={monitored ? 'eye-slash' : 'eye'}
            label={monitored ? c('Action').t`Exclude from monitoring` : c('Action').t`Include in monitoring`}
        />
    );

    const onManageItem = free
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

    const itemSharingEnabled = useFeatureFlag(PassFeature.PassItemSharingV1);
    const showSharing = type !== 'alias' && isOwnerOrAdmin && (itemSharingEnabled || isVault);

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
                                    disabled={optimistic}
                                >
                                    <DropdownMenuButton
                                        onClick={handleRestoreClick}
                                        label={c('Action').t`Restore item`}
                                        icon="arrows-rotate"
                                        disabled={sharedReadOnly}
                                    />

                                    <DropdownMenuButton
                                        onClick={handleDeleteClick}
                                        label={c('Action').t`Delete permanently`}
                                        icon="trash-cross"
                                        disabled={sharedReadOnly}
                                    />

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
                                disabled={optimistic || readOnly}
                            >
                                <Icon name="pencil" className="mr-1" />
                                <span>{c('Action').t`Edit`}</span>
                            </Button>,

                            ...actions,

                            showSharing && (
                                <QuickActionsDropdown
                                    key="share-item-button"
                                    color="norm"
                                    shape="ghost"
                                    icon="users-plus"
                                    menuClassName="flex flex-column gap-2"
                                    dropdownHeader={c('Label').t`Share`}
                                    disabled={!online || optimistic}
                                    badge={shared ? shareCount : undefined}
                                    signaled={isOwnerOrAdmin && signalItemSharing}
                                    dropdownSize={{
                                        height: DropdownSizeUnit.Dynamic,
                                        width: DropdownSizeUnit.Dynamic,
                                        maxHeight: DropdownSizeUnit.Viewport,
                                        maxWidth: '20rem',
                                    }}
                                >
                                    {itemSharingEnabled && (
                                        <DropdownMenuButton
                                            onClick={onItemShare}
                                            label={
                                                <DropdownMenuLabel
                                                    title={c('Action').t`With other ${BRAND_NAME} users`}
                                                    subtitle={c('Label').t`Useful for permanent sharing`}
                                                />
                                            }
                                            icon="link"
                                            extra={
                                                (free && <PassPlusPromotionButton className="ml-2" />) ||
                                                (signalItemSharing && <Badge type="info">{c('Label').t`New`}</Badge>)
                                            }
                                        />
                                    )}

                                    {/** NOTE: disabling secure links for non-vault shares
                                     * until we start using the `itemKey` to encrypt the
                                     * `secureLinkKey` with */}
                                    {isVault && (
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

                                    {shared && itemSharingEnabled && (
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
                                disabled={optimistic}
                                shape="ghost"
                            >
                                {canMove && (
                                    <DropdownMenuButton
                                        onClick={handleMoveToVaultClick}
                                        label={c('Action').t`Move to another vault`}
                                        icon="folder-arrow-in"
                                        disabled={sharedReadOnly}
                                    />
                                )}

                                {quickActions}

                                <DropdownMenuButton
                                    onClick={handlePinClick}
                                    label={pinned ? c('Action').t`Unpin item` : c('Action').t`Pin item`}
                                    icon={pinned ? 'pin-angled-slash' : 'pin-angled'}
                                    disabled={optimistic || !canTogglePinned}
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
                                    disabled={sharedReadOnly}
                                />

                                {monitorActions}

                                {shared && !owner && (
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
                        isVault && owner && hasMultipleVaults ? (
                            <VaultTag
                                title={share.content.name}
                                color={share.content.display.color}
                                count={targetMembers}
                                shared={share.shared}
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
