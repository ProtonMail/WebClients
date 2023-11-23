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
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { isVaultMemberLimitReached } from '@proton/pass/lib/vaults/vault.predicates';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import { selectAllVaults, selectPassPlan } from '@proton/pass/store/selectors';
import { type ItemType, ShareRole } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';

import { Panel } from './Panel';
import { PanelHeader } from './PanelHeader';

type Props = {
    type: ItemType;
    name: string;
    vault: VaultShareItem;
    actions?: ReactElement[];
    quickActions?: ReactElement[];
} & Omit<ItemViewProps, 'revision' | 'vault'>;

export const ItemViewPanel: FC<Props> = ({
    type,
    name,
    vault,
    optimistic,
    failed,
    trashed,
    actions = [],
    quickActions = [],

    handleEditClick,
    handleRetryClick,
    handleDismissClick,
    handleMoveToTrashClick,
    handleMoveToVaultClick,
    handleRestoreClick,
    handleDeleteClick,
    handleInviteClick,
    handleManageClick,

    children,
}) => {
    const vaults = useSelector(selectAllVaults);
    const plan = useSelector(selectPassPlan);
    const sharingEnabled = useFeatureFlag(PassFeature.PassSharingV1);
    const hasMultipleVaults = vaults.length > 1;
    const { shareRoleId, shared } = vault;
    const showVaultTag = hasMultipleVaults || shared;
    const readOnly = shareRoleId === ShareRole.READ;
    const sharedReadOnly = shared && readOnly;
    const spotlight = useSpotlight();

    return (
        <Panel
            className={itemTypeToSubThemeClassName[type]}
            header={
                <PanelHeader
                    title={name}
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
                                className="flex flex-align-center text-sm"
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
                                    disabled={readOnly}
                                    onClick={
                                        plan === UserPassPlan.FREE && isVaultMemberLimitReached(vault)
                                            ? () => spotlight.setUpselling('pass-plus')
                                            : handleInviteClick
                                    }
                                >
                                    <Icon name="users-plus" alt={c('Action').t`Share`} size={20} />
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
                                    <Icon name="users-plus" alt={c('Action').t`See members`} size={20} />
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
