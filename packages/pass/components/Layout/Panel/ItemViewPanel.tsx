import type { FC, ReactElement, ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import { IcArrowOutFromRectangle } from '@proton/icons/icons/IcArrowOutFromRectangle';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';
import { IcEye } from '@proton/icons/icons/IcEye';
import { IcEyeSlash } from '@proton/icons/icons/IcEyeSlash';
import { IcFolderArrowIn } from '@proton/icons/icons/IcFolderArrowIn';
import { IcLink } from '@proton/icons/icons/IcLink';
import { IcPencil } from '@proton/icons/icons/IcPencil';
import { IcPinAngled } from '@proton/icons/icons/IcPinAngled';
import { IcPinAngledSlash } from '@proton/icons/icons/IcPinAngledSlash';
import { IcSquaresPlus } from '@proton/icons/icons/IcSquaresPlus';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { IcTrashCross } from '@proton/icons/icons/IcTrashCross';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { IcUsersPlus } from '@proton/icons/icons/IcUsersPlus';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { UpsellRef } from '../../../constants';
import type { ItemActions } from '../../../hooks/items/useItemActions';
import { useItemActions } from '../../../hooks/items/useItemActions';
import { useItemState } from '../../../hooks/items/useItemState';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { useItemLoading } from '../../../hooks/useItemLoading';
import { isVaultShare } from '../../../lib/shares/share.predicates';
import { selectAllVaults, selectPassPlan, selectUserPlan } from '../../../store/selectors';
import { type ItemType, SpotlightMessage } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { UserPassPlan } from '../../../types/api/plan';
import { VaultIcon } from '../../../types/protobuf/vault-v1.static';
import { useOnline } from '../../Core/ConnectivityProvider';
import { useSpotlightFor } from '../../Spotlight/WithSpotlight';
import { PassPlusPromotionButton } from '../../Upsell/PassPlusPromotionButton';
import { useUpselling } from '../../Upsell/UpsellingProvider';
import { FolderBreadcrumb } from '../../Vault/FolderBreadcrumb';
import type { ItemViewProps } from '../../Views/types';
import { DropdownMenuButton } from '../Dropdown/DropdownMenuButton';
import { DropdownMenuLabel } from '../Dropdown/DropdownMenuLabel';
import { QuickActionsDropdown } from '../Dropdown/QuickActionsDropdown';
import { itemTypeToSubThemeClassName } from '../Theme/types';
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

    const showSharing =
        (owner || itemState.isShared) &&
        !itemState.isReadOnly &&
        (itemState.canItemShare || itemState.canLinkShare || itemState.canManageAccess);

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
        [data.content.password, data.content.itemEmail, data.content.itemUsername].some(({ v }) => v?.length);

    const monitorActions = itemState.canMonitor && (
        <DropdownMenuButton
            disabled={actionsDisabled}
            onClick={itemActions.onToggleFlags}
            icon={itemState.isMonitored ? IcEyeSlash : IcEye}
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
                    title={
                        <h2 className="text-2xl text-bold text-ellipsis mb-0-5" title={name}>
                            {name}
                        </h2>
                    }
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
                                        icon={IcArrowsRotate}
                                        disabled={itemState.isReadOnly}
                                    />

                                    <DropdownMenuButton
                                        onClick={itemActions.onDelete}
                                        label={c('Action').t`Delete permanently`}
                                        icon={IcTrashCross}
                                        disabled={itemState.isReadOnly}
                                    />

                                    {itemState.canLeave && (
                                        <DropdownMenuButton
                                            onClick={itemActions.onLeave}
                                            label={c('Action').t`Leave`}
                                            icon={IcArrowOutFromRectangle}
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
                                <IcPencil className="mr-1" />
                                <span>{c('Action').t`Edit`}</span>
                            </Button>,

                            ...extraActions,

                            showSharing && (
                                <QuickActionsDropdown
                                    key="share-item-button"
                                    color="weak"
                                    shape="solid"
                                    pill
                                    icon={IcUsersPlus}
                                    menuClassName="flex flex-column"
                                    dropdownHeader={c('Label').t`Share`}
                                    disabled={!online || actionsDisabled}
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
                                            icon={IcUserPlus}
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
                                            icon={IcLink}
                                            extra={itemState.isFree && <PassPlusPromotionButton className="ml-2" />}
                                        />
                                    )}

                                    {itemState.canManageAccess && (
                                        <DropdownMenuButton
                                            onClick={onManageItem}
                                            title={c('Action').t`See members`}
                                            icon={IcUsers}
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
                                        label={c('Action').t`Move to`}
                                        icon={IcFolderArrowIn}
                                    />
                                )}

                                {itemState.canClone && (
                                    <DropdownMenuButton
                                        onClick={itemActions.onClone}
                                        label={c('Action').t`Duplicate`}
                                        icon={IcSquaresPlus}
                                        disabled={itemState.isReadOnly}
                                    />
                                )}

                                {quickActions}

                                <DropdownMenuButton
                                    onClick={itemActions.onPin}
                                    label={itemState.isPinned ? c('Action').t`Unpin item` : c('Action').t`Pin item`}
                                    icon={itemState.isPinned ? IcPinAngledSlash : IcPinAngled}
                                    disabled={!itemState.canTogglePinned}
                                    loading={!itemState.canTogglePinned}
                                />

                                {itemState.canHistory && (
                                    <DropdownMenuButton
                                        onClick={itemActions.onHistory}
                                        label={c('Action').t`View history`}
                                        icon={IcClockRotateLeft}
                                    />
                                )}

                                <DropdownMenuButton
                                    onClick={itemActions.onTrash}
                                    label={c('Action').t`Move to Trash`}
                                    icon={IcTrash}
                                    disabled={itemState.isReadOnly}
                                />

                                {monitorActions}

                                {itemState.canLeave && (
                                    <DropdownMenuButton
                                        onClick={itemActions.onLeave}
                                        label={c('Action').t`Leave`}
                                        icon={IcArrowOutFromRectangle}
                                    />
                                )}
                            </QuickActionsDropdown>,
                        ];
                    })()}
                    subtitle={
                        isVault && (hasMultipleVaults || revision.folderId) ? (
                            <FolderBreadcrumb
                                shareId={share.shareId}
                                folderId={revision.folderId}
                                vaultName={share.content.name}
                                vaultColor={share.content.display.color}
                                vaultIcon={share.content.display.icon ?? VaultIcon.ICON1}
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
