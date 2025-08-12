import type { FC, PropsWithChildren, ReactElement } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import { useOnline } from '@proton/pass/components/Core/ConnectivityProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { DropdownMenuLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuLabel';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { VaultTag } from '@proton/pass/components/Vault/VaultTag';
import { VAULT_ICON_MAP } from '@proton/pass/components/Vault/constants';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { UpsellRef } from '@proton/pass/constants';
import { useItemActions } from '@proton/pass/hooks/items/useItemActions';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useItemLoading } from '@proton/pass/hooks/useItemLoading';
import { isMonitored, isPinned } from '@proton/pass/lib/items/item.predicates';
import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { itemPinRequest, itemUnpinRequest } from '@proton/pass/store/actions/requests';
import { selectAllVaults, selectRequestInFlight } from '@proton/pass/store/selectors';
import { type ItemType, SpotlightMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { BRAND_NAME } from '@proton/shared/lib/constants';

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
    actions: extraActions = [],
    children,
    quickActions = [],
    revision,
    share,
    type,
    handleSecureLinkClick,
}) => {
    const upsell = useUpselling();

    const { shareId, itemId, data, optimistic, failed } = revision;
    const { name } = data.metadata;
    const pinned = isPinned(revision);
    const online = useOnline();
    const isVault = isVaultShare(share);

    const vaults = useSelector(selectAllVaults);
    const monitored = isMonitored(revision);
    const loading = useItemLoading(revision);
    const actionsDisabled = loading || optimistic;

    const {
        state: {
            isShared,
            isReadOnly,
            isTrashed,
            isFree,

            canMonitor,
            canLeave,
            canItemShare,
            canLinkShare,
            canManageAccess,
            canMove,
            canClone,
            canHistory,
        },
        actions: {
            onToggleFlags,
            onShare,
            onDismiss,
            onRestore,
            onDelete,
            onLeave,
            onRetry,
            onEdit,
            onMove,
            onPin,
            onHistory,
            onClone,
            onTrash,
            onManage,
        },
    } = useItemActions(revision, share);

    const { owner, targetMembers } = share;

    const hasMultipleVaults = vaults.length > 1;

    const pinInFlight = useSelector(selectRequestInFlight(itemPinRequest(shareId, itemId)));
    const unpinInFlight = useSelector(selectRequestInFlight(itemUnpinRequest(shareId, itemId)));
    const canTogglePinned = !(pinInFlight || unpinInFlight);
    const accessCount = targetMembers + (revision.shareCount ?? 0);

    const disabledSharing = !(canItemShare || canLinkShare || canManageAccess);
    const showSharing = (owner || isShared) && !isReadOnly;

    const autotypeEnabled = useFeatureFlag(PassFeature.PassDesktopAutotype);
    const autotypeDiscoverySpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_DISCOVERY);
    const signalQuickActions = autotypeEnabled && autotypeDiscoverySpotlight.open && type === 'login';

    const monitorActions = canMonitor && (
        <DropdownMenuButton
            disabled={actionsDisabled}
            onClick={onToggleFlags}
            icon={monitored ? 'eye-slash' : 'eye'}
            label={monitored ? c('Action').t`Exclude from monitoring` : c('Action').t`Include in monitoring`}
        />
    );

    /** Free user might have shared the vault - avoid upselling
     * from the `manage access` button in this case */
    const onManageItem =
        isFree && !share.shared ? () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.ITEM_SHARING }) : onManage;

    const onSecureLink = isFree
        ? () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.SECURE_LINKS })
        : handleSecureLinkClick;

    const onItemShare = isFree
        ? () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.ITEM_SHARING })
        : () => onShare();

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
                                    onClick={onDismiss}
                                >
                                    {c('Action').t`Dismiss`}
                                </Button>,
                                <Button key="retry-item-button" pill color="norm" onClick={onRetry}>
                                    {c('Action').t`Retry`}
                                </Button>,
                            ];
                        }

                        if (isTrashed) {
                            return [
                                <QuickActionsDropdown
                                    key="item-quick-actions-dropdown"
                                    color="weak"
                                    shape="ghost"
                                    disabled={actionsDisabled}
                                >
                                    <DropdownMenuButton
                                        onClick={onRestore}
                                        label={c('Action').t`Restore item`}
                                        icon="arrows-rotate"
                                        disabled={isReadOnly}
                                    />

                                    <DropdownMenuButton
                                        onClick={onDelete}
                                        label={c('Action').t`Delete permanently`}
                                        icon="trash-cross"
                                        disabled={isReadOnly}
                                    />

                                    {canLeave && (
                                        <DropdownMenuButton
                                            onClick={onLeave}
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
                                onClick={onEdit}
                                disabled={actionsDisabled || isReadOnly}
                            >
                                <Icon name="pencil" className="mr-1" />
                                <span>{c('Action').t`Edit`}</span>
                            </Button>,

                            ...extraActions,

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
                                            extra={isFree && <PassPlusPromotionButton className="ml-2" />}
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
                                            extra={isFree && <PassPlusPromotionButton className="ml-2" />}
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
                                signaled={signalQuickActions}
                            >
                                {canMove && (
                                    <DropdownMenuButton
                                        onClick={onMove}
                                        label={c('Action').t`Move to another vault`}
                                        icon="folder-arrow-in"
                                    />
                                )}

                                {canClone && (
                                    <DropdownMenuButton
                                        onClick={onClone}
                                        label={c('Action').t`Duplicate`}
                                        icon="squares-plus"
                                        disabled={isReadOnly}
                                    />
                                )}

                                {quickActions}

                                <DropdownMenuButton
                                    onClick={onPin}
                                    label={pinned ? c('Action').t`Unpin item` : c('Action').t`Pin item`}
                                    icon={pinned ? 'pin-angled-slash' : 'pin-angled'}
                                    disabled={!canTogglePinned}
                                    loading={!canTogglePinned}
                                />

                                {canHistory && (
                                    <DropdownMenuButton
                                        onClick={onHistory}
                                        label={c('Action').t`View history`}
                                        icon={'clock-rotate-left'}
                                    />
                                )}

                                <DropdownMenuButton
                                    onClick={onTrash}
                                    label={c('Action').t`Move to Trash`}
                                    icon="trash"
                                    disabled={isReadOnly}
                                />

                                {monitorActions}

                                {canLeave && (
                                    <DropdownMenuButton
                                        onClick={onLeave}
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
