import type { PropsWithChildren } from 'react';
import { type FC, type ReactElement } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { VaultTag } from '@proton/pass/components/Vault/VaultTag';
import { VAULT_ICON_MAP } from '@proton/pass/components/Vault/constants';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { UpsellRef } from '@proton/pass/constants';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { isHealthCheckSkipped, isPinned, isTrashed } from '@proton/pass/lib/items/item.predicates';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { isVaultMemberLimitReached } from '@proton/pass/lib/vaults/vault.predicates';
import { itemPinRequest, itemUnpinRequest } from '@proton/pass/store/actions/requests';
import { selectAllVaults, selectPassPlan, selectRequestInFlight } from '@proton/pass/store/selectors';
import { type ItemType, ShareRole } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';

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
    type,
    vault,
    handleDeleteClick,
    handleDismissClick,
    handleEditClick,
    handleHistoryClick,
    handleInviteClick,
    handleManageClick,
    handleMoveToTrashClick,
    handleMoveToVaultClick,
    handlePinClick,
    handleRestoreClick,
    handleRetryClick,
    handleToggleFlagsClick,
}) => {
    const { shareId, itemId, data, optimistic, failed } = revision;
    const { name } = data.metadata;
    const trashed = isTrashed(revision);
    const pinned = isPinned(revision);

    const vaults = useSelector(selectAllVaults);
    const plan = useSelector(selectPassPlan);
    const sharingEnabled = useFeatureFlag(PassFeature.PassSharingV1);
    const pinningEnabled = useFeatureFlag(PassFeature.PassPinningV1);
    const historyEnabled = useFeatureFlag(PassFeature.PassItemHistoryV1);
    const monitorEnabled = useFeatureFlag(PassFeature.PassMonitor);
    const healthCheckSkipped = isHealthCheckSkipped(revision);

    const hasMultipleVaults = vaults.length > 1;
    const { shareRoleId, shared } = vault;
    const showVaultTag = hasMultipleVaults || shared;
    const readOnly = shareRoleId === ShareRole.READ;
    const sharedReadOnly = shared && readOnly;
    const spotlight = useSpotlight();

    const pinInFlight = useSelector(selectRequestInFlight(itemPinRequest(shareId, itemId)));
    const unpinInFlight = useSelector(selectRequestInFlight(itemUnpinRequest(shareId, itemId)));
    const canTogglePinned = !(pinInFlight || unpinInFlight);

    const monitorActions = (
        <>
            {monitorEnabled && (
                <DropdownMenuButton
                    disabled={optimistic}
                    onClick={handleToggleFlagsClick}
                    icon={healthCheckSkipped ? 'eye' : 'eye-slash'}
                    label={
                        healthCheckSkipped
                            ? c('Action').t`Include in monitoring`
                            : c('Action').t`Exclude from monitoring`
                    }
                />
            )}
        </>
    );

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
                                    shape="solid"
                                    disabled={optimistic}
                                >
                                    <DropdownMenuButton
                                        onClick={handleRestoreClick}
                                        label={c('Action').t`Restore item`}
                                        icon="arrows-rotate"
                                        disabled={sharedReadOnly}
                                    />
                                    {monitorActions}
                                    <DropdownMenuButton
                                        onClick={handleDeleteClick}
                                        label={c('Action').t`Delete permanently`}
                                        icon="trash-cross"
                                        disabled={sharedReadOnly}
                                    />
                                </QuickActionsDropdown>,
                            ];
                        }

                        return [
                            <Button
                                className="flex text-sm"
                                key="edit-item-button"
                                pill
                                shape="solid"
                                color="norm"
                                onClick={handleEditClick}
                                disabled={optimistic || readOnly}
                            >
                                <Icon name="pencil" className="mr-1" />
                                <span>{c('Action').t`Edit`}</span>
                            </Button>,

                            ...actions,

                            sharingEnabled && !shared && (
                                <Button
                                    key="share-item-button"
                                    icon
                                    pill
                                    color="weak"
                                    shape="solid"
                                    size="medium"
                                    title={c('Action').t`Share`}
                                    disabled={optimistic || readOnly}
                                    onClick={
                                        plan === UserPassPlan.FREE && isVaultMemberLimitReached(vault)
                                            ? () =>
                                                  spotlight.setUpselling({
                                                      type: 'pass-plus',
                                                      upsellRef: UpsellRef.LIMIT_SHARING,
                                                  })
                                            : handleInviteClick
                                    }
                                >
                                    <Icon name="users-plus" alt={c('Action').t`Share`} size={5} />
                                </Button>
                            ),

                            shared && (
                                <Button
                                    key="manage-item-button"
                                    icon
                                    pill
                                    color="weak"
                                    shape="solid"
                                    size="medium"
                                    title={c('Action').t`See members`}
                                    onClick={handleManageClick}
                                >
                                    <Icon name="users-plus" alt={c('Action').t`See members`} size={5} />
                                </Button>
                            ),

                            <QuickActionsDropdown
                                key="item-quick-actions-dropdown"
                                color="weak"
                                disabled={optimistic}
                                shape="solid"
                            >
                                {hasMultipleVaults && (
                                    <DropdownMenuButton
                                        onClick={handleMoveToVaultClick}
                                        label={c('Action').t`Move to another vault`}
                                        icon="folder-arrow-in"
                                        disabled={sharedReadOnly}
                                    />
                                )}

                                {quickActions}

                                {pinningEnabled && (
                                    <DropdownMenuButton
                                        onClick={handlePinClick}
                                        label={pinned ? c('Action').t`Unpin item` : c('Action').t`Pin item`}
                                        icon={pinned ? 'pin-angled-slash' : 'pin-angled'}
                                        disabled={optimistic || !canTogglePinned}
                                        loading={!canTogglePinned}
                                    />
                                )}

                                {historyEnabled && isPaidPlan(plan) && (
                                    <DropdownMenuButton
                                        onClick={handleHistoryClick}
                                        label={c('Action').t`View history`}
                                        icon={'clock-rotate-left'}
                                    />
                                )}
                                {monitorActions}
                                <DropdownMenuButton
                                    onClick={handleMoveToTrashClick}
                                    label={c('Action').t`Move to Trash`}
                                    icon="trash"
                                    disabled={sharedReadOnly}
                                />
                            </QuickActionsDropdown>,
                        ];
                    })()}
                    subtitle={
                        showVaultTag ? (
                            <VaultTag
                                title={vault.content.name}
                                color={vault.content.display.color}
                                count={vault.targetMembers}
                                shared={vault.shared}
                                icon={
                                    vault.content.display.icon
                                        ? VAULT_ICON_MAP[vault.content.display.icon]
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
