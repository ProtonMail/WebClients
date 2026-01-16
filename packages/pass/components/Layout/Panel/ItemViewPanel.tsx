import type { FC, ReactElement, ReactNode } from 'react';
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
import type { ItemActions } from '@proton/pass/hooks/items/useItemActions';
import { useItemActions } from '@proton/pass/hooks/items/useItemActions';
import { useItemState } from '@proton/pass/hooks/items/useItemState';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useItemLoading } from '@proton/pass/hooks/useItemLoading';
import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { selectAllVaults, selectPassPlan, selectUserPlan } from '@proton/pass/store/selectors';
import { type ItemType, SpotlightMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { Panel } from './Panel';
import { PanelHeader } from './PanelHeader';

type Props = {
    /** extra actions visible on the panel header */
    actions?: ReactElement[];
    /** extra quick actions in the actions dropdown menu */
    quickActions?: ReactElement[];
    type: ItemType;
    children: (actions: ItemActions) => ReactNode;
} & ItemViewProps;

export const ItemViewPanel: FC<Props> = ({
    actions: extraActions = [],
    children,
    quickActions = [],
    revision,
    share,
    type,
    handleSecureLinkClick,
}) => {
    const upsell = useUpselling();
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const isPassEssentials = useSelector(selectUserPlan)?.InternalName === 'passpro2024';

    const { data, optimistic, failed } = revision;
    const { name } = data.metadata;
    const online = useOnline();
    const isVault = isVaultShare(share);

    const vaults = useSelector(selectAllVaults);
    const loading = useItemLoading(revision);
    const actionsDisabled = loading || optimistic;

    const itemState = useItemState(revision, share);
    const itemActions = useItemActions(revision);

    const { owner, targetMembers } = share;

    const hasMultipleVaults = vaults.length > 1;

    const accessCount = targetMembers + (revision.shareCount ?? 0);

    const disabledSharing = !(itemState.canItemShare || itemState.canLinkShare || itemState.canManageAccess);
    const showSharing = (owner || itemState.isShared) && !itemState.isReadOnly;

    const autotypeEnabled = useFeatureFlag(PassFeature.PassDesktopAutotype);
    const autotypeDiscoverySpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_DISCOVERY);
    /** Autotype on Linux is considered experimental so we don't show the discovery dot there */
    const signalQuickActions =
        BUILD_TARGET !== 'linux' &&
        autotypeEnabled &&
        !isFreePlan &&
        !isPassEssentials &&
        autotypeDiscoverySpotlight.open &&
        data.type === 'login' &&
        Boolean(data.content.password.v || data.content.itemEmail.v || data.content.itemUsername.v);

    const monitorActions = itemState.canMonitor && (
        <DropdownMenuButton
            disabled={actionsDisabled}
            onClick={itemActions.onToggleFlags}
            icon={itemState.isMonitored ? 'eye-slash' : 'eye'}
            label={
                itemState.isMonitored ? c('Action').t`Exclude from monitoring` : c('Action').t`Include in monitoring`
            }
        />
    );

    /** Free user might have shared the vault - avoid upselling
     * from the `manage access` button in this case */
    const onManageItem =
        itemState.isFree && !share.shared
            ? () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.ITEM_SHARING })
            : itemActions.onManage;

    const onSecureLink = itemState.isFree
        ? () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.SECURE_LINKS })
        : handleSecureLinkClick;

    const onItemShare = itemState.isFree
        ? () => upsell({ type: 'pass-plus', upsellRef: UpsellRef.ITEM_SHARING })
        : () => itemActions.onShare();

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
                                    onClick={itemActions.onDismiss}
                                >
                                    {c('Action').t`Dismiss`}
                                </Button>,
                                <Button key="retry-item-button" pill color="norm" onClick={itemActions.onRetry}>
                                    {c('Action').t`Retry`}
                                </Button>,
                            ];
                        }

                        if (itemState.isTrashed) {
                            return [
                                <QuickActionsDropdown
                                    key="item-quick-actions-dropdown"
                                    color="weak"
                                    shape="ghost"
                                    disabled={actionsDisabled}
                                >
                                    <DropdownMenuButton
                                        onClick={itemActions.onRestore}
                                        label={c('Action').t`Restore item`}
                                        icon="arrows-rotate"
                                        disabled={itemState.isReadOnly}
                                    />

                                    <DropdownMenuButton
                                        onClick={itemActions.onDelete}
                                        label={c('Action').t`Delete permanently`}
                                        icon="trash-cross"
                                        disabled={itemState.isReadOnly}
                                    />

                                    {itemState.canLeave && (
                                        <DropdownMenuButton
                                            onClick={itemActions.onLeave}
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
                                onClick={itemActions.onEdit}
                                disabled={actionsDisabled || itemState.isReadOnly}
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
                                    {itemState.canItemShare && (
                                        <DropdownMenuButton
                                            onClick={onItemShare}
                                            label={
                                                <DropdownMenuLabel
                                                    title={c('Action').t`With other ${BRAND_NAME} users`}
                                                    subtitle={c('Label').t`Useful for permanent sharing`}
                                                />
                                            }
                                            icon="user-plus"
                                            extra={itemState.isFree && <PassPlusPromotionButton className="ml-2" />}
                                        />
                                    )}

                                    {itemState.canLinkShare && (
                                        <DropdownMenuButton
                                            onClick={onSecureLink}
                                            label={
                                                <DropdownMenuLabel
                                                    title={c('Action').t`Via secure link`}
                                                    subtitle={c('Label').t`For a one-off sharing`}
                                                />
                                            }
                                            icon="link"
                                            extra={itemState.isFree && <PassPlusPromotionButton className="ml-2" />}
                                        />
                                    )}

                                    {itemState.canManageAccess && (
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
                                {itemState.canMove && (
                                    <DropdownMenuButton
                                        onClick={itemActions.onMove}
                                        label={c('Action').t`Move to another vault`}
                                        icon="folder-arrow-in"
                                    />
                                )}

                                {itemState.canClone && (
                                    <DropdownMenuButton
                                        onClick={itemActions.onClone}
                                        label={c('Action').t`Duplicate`}
                                        icon="squares-plus"
                                        disabled={itemState.isReadOnly}
                                    />
                                )}

                                {quickActions}

                                <DropdownMenuButton
                                    onClick={itemActions.onPin}
                                    label={itemState.isPinned ? c('Action').t`Unpin item` : c('Action').t`Pin item`}
                                    icon={itemState.isPinned ? 'pin-angled-slash' : 'pin-angled'}
                                    disabled={!itemState.canTogglePinned}
                                    loading={!itemState.canTogglePinned}
                                />

                                {itemState.canHistory && (
                                    <DropdownMenuButton
                                        onClick={itemActions.onHistory}
                                        label={c('Action').t`View history`}
                                        icon={'clock-rotate-left'}
                                    />
                                )}

                                <DropdownMenuButton
                                    onClick={itemActions.onTrash}
                                    label={c('Action').t`Move to Trash`}
                                    icon="trash"
                                    disabled={itemState.isReadOnly}
                                />

                                {monitorActions}

                                {itemState.canLeave && (
                                    <DropdownMenuButton
                                        onClick={itemActions.onLeave}
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
            {children(itemActions)}
        </Panel>
    );
};
