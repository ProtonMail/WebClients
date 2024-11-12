import type { PropsWithChildren } from 'react';
import { type FC, type ReactElement } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { DropdownSizeUnit, Icon } from '@proton/components';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { DropdownMenuLabel } from '@proton/pass/components/Layout/Dropdown/DropdownMenuLabel';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { itemTypeToSubThemeClassName } from '@proton/pass/components/Layout/Theme/types';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { VaultTag } from '@proton/pass/components/Vault/VaultTag';
import { VAULT_ICON_MAP } from '@proton/pass/components/Vault/constants';
import type { ItemViewProps } from '@proton/pass/components/Views/types';
import { UpsellRef } from '@proton/pass/constants';
import { isMonitored, isPinned, isTrashed } from '@proton/pass/lib/items/item.predicates';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import { isVaultMemberLimitReached } from '@proton/pass/lib/vaults/vault.predicates';
import { itemPinRequest, itemUnpinRequest } from '@proton/pass/store/actions/requests';
import { selectAllVaults, selectPassPlan, selectRequestInFlight } from '@proton/pass/store/selectors';
import { type ItemType, ShareRole } from '@proton/pass/types';
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
    handleSecureLinkClick,
    handleToggleFlagsClick,
}) => {
    const { shareId, itemId, data, optimistic, failed } = revision;
    const { name } = data.metadata;
    const trashed = isTrashed(revision);
    const pinned = isPinned(revision);
    const online = useConnectivity();

    const vaults = useSelector(selectAllVaults);
    const plan = useSelector(selectPassPlan);
    const monitored = isMonitored(revision);

    const hasMultipleVaults = vaults.length > 1;
    const { shareRoleId, shared, owner, targetMembers } = vault;
    const showVaultTag = hasMultipleVaults || shared;
    const free = plan === UserPassPlan.FREE;
    const readOnly = shareRoleId === ShareRole.READ;
    const isOwnerOrAdmin = owner || shareRoleId === ShareRole.ADMIN;
    const sharedReadOnly = shared && readOnly;
    const spotlight = useSpotlight();

    const pinInFlight = useSelector(selectRequestInFlight(itemPinRequest(shareId, itemId)));
    const unpinInFlight = useSelector(selectRequestInFlight(itemUnpinRequest(shareId, itemId)));
    const canTogglePinned = !(pinInFlight || unpinInFlight);

    const monitorActions = !EXTENSION_BUILD && !trashed && data.type === 'login' && (
        <DropdownMenuButton
            disabled={optimistic}
            onClick={handleToggleFlagsClick}
            icon={monitored ? 'eye-slash' : 'eye'}
            label={monitored ? c('Action').t`Exclude from monitoring` : c('Action').t`Include in monitoring`}
        />
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

                            <QuickActionsDropdown
                                key="share-item-button"
                                color="norm"
                                shape="ghost"
                                icon="users-plus"
                                menuClassName="flex flex-column gap-2"
                                dropdownHeader={c('Label').t`Share`}
                                disabled={!online}
                                dropdownSize={{
                                    height: DropdownSizeUnit.Dynamic,
                                    width: DropdownSizeUnit.Dynamic,
                                    maxHeight: DropdownSizeUnit.Viewport,
                                    maxWidth: '20rem',
                                }}
                            >
                                {type !== 'alias' && (
                                    <DropdownMenuButton
                                        onClick={
                                            free
                                                ? () =>
                                                      spotlight.setUpselling({
                                                          type: 'pass-plus',
                                                          upsellRef: UpsellRef.SECURE_LINKS,
                                                      })
                                                : handleSecureLinkClick
                                        }
                                        label={
                                            <DropdownMenuLabel
                                                title={c('Action').t`Via secure link`}
                                                subtitle={c('Label').t`Generate a secure link for this item`}
                                            />
                                        }
                                        icon="link"
                                        disabled={optimistic || !isOwnerOrAdmin}
                                        extra={free && <PassPlusPromotionButton className="ml-2" />}
                                    />
                                )}
                                {!shared && (
                                    <DropdownMenuButton
                                        onClick={
                                            free && isVaultMemberLimitReached(vault)
                                                ? () =>
                                                      spotlight.setUpselling({
                                                          type: 'pass-plus',
                                                          upsellRef: UpsellRef.LIMIT_SHARING,
                                                      })
                                                : handleInviteClick
                                        }
                                        title={c('Action').t`Share`}
                                        label={
                                            <DropdownMenuLabel
                                                title={c('Action').t`Entire vault`}
                                                subtitle={c('Label').t`Share this vault or create a new vault`}
                                            />
                                        }
                                        icon="folder-plus"
                                        disabled={optimistic || readOnly}
                                    />
                                )}
                                {shared && (
                                    <DropdownMenuButton
                                        onClick={handleManageClick}
                                        title={c('Action').t`See members`}
                                        icon="users"
                                        label={
                                            <DropdownMenuLabel
                                                title={c('Action').t`Manage vault access`}
                                                subtitle={c('Label').ngettext(
                                                    msgid`The item's vault is currently shared with ${targetMembers} person`,
                                                    `The item's vault is currently shared with ${targetMembers} people`,
                                                    targetMembers
                                                )}
                                            />
                                        }
                                    />
                                )}
                            </QuickActionsDropdown>,

                            <QuickActionsDropdown
                                key="item-quick-actions-dropdown"
                                color="norm"
                                disabled={optimistic}
                                shape="ghost"
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
