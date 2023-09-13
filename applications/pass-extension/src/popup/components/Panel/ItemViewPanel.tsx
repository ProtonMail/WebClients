import { type FC, type ReactElement } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { selectAllVaults } from '@proton/pass/store';
import type { ItemType, VaultShare } from '@proton/pass/types';

import type { ItemTypeViewProps } from '../../../shared/items/types';
import { itemTypeToSubThemeClassName } from '../../../shared/theme/sub-theme';
import { QuickActionsDropdown } from '../../components/Dropdown/QuickActionsDropdown';
import { VAULT_ICON_MAP } from '../../components/Vault/constants';
import { DropdownMenuButton } from '../Dropdown/DropdownMenuButton';
import { PanelHeader } from './Header';
import { Panel } from './Panel';

type Props = {
    type: ItemType;
    name: string;
    vault: VaultShare;
    actions?: ReactElement[];
    quickActions?: ReactElement[];
} & Omit<ItemTypeViewProps, 'revision' | 'vault'>;

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

    children,
}) => {
    const vaults = useSelector(selectAllVaults);
    const hasMultipleVaults = vaults.length > 1;

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
                                    />
                                    <DropdownMenuButton
                                        onClick={handleDeleteClick}
                                        label={c('Action').t`Delete permanently`}
                                        icon="trash-cross"
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
                                disabled={optimistic}
                            >
                                <Icon name="pencil" className="mr-1" />
                                <span>{c('Action').t`Edit`}</span>
                            </Button>,

                            ...actions,

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
                                    />
                                )}

                                {quickActions}

                                <DropdownMenuButton
                                    onClick={handleMoveToTrashClick}
                                    label={c('Action').t`Move to Trash`}
                                    icon="trash"
                                />
                            </QuickActionsDropdown>,
                        ];
                    })()}
                    {...(hasMultipleVaults
                        ? {
                              subtitle: vault.content.name,
                              subtitleIcon: vault.content.display.icon
                                  ? VAULT_ICON_MAP[vault.content.display.icon]
                                  : 'pass-all-vaults',
                          }
                        : {})}
                />
            }
        >
            {children}
        </Panel>
    );
};
