import { type FC, type ReactElement } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { DropdownMenuButton, Icon } from '@proton/components';
import { selectAllVaults } from '@proton/pass/store';
import type { ItemType, VaultShare } from '@proton/pass/types';

import type { ItemTypeViewProps } from '../../../shared/items/types';
import { itemTypeToSubThemeClassName } from '../../../shared/theme/sub-theme';
import { QuickActionsDropdown } from '../../components/Dropdown/QuickActionsDropdown';
import { VAULT_ICON_MAP } from '../../components/Vault/constants';
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
                                        className="flex flex-align-items-center text-left"
                                        onClick={handleRestoreClick}
                                    >
                                        <Icon name="arrows-rotate" className="mr-2" />
                                        {c('Action').t`Restore item`}
                                    </DropdownMenuButton>
                                    <DropdownMenuButton
                                        className="flex flex-align-items-center text-left"
                                        onClick={handleDeleteClick}
                                    >
                                        <Icon name="trash-cross" className="mr-2" />
                                        {c('Action').t`Delete permanently`}
                                    </DropdownMenuButton>
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
                                        className="flex flex-align-items-center text-left"
                                        onClick={handleMoveToVaultClick}
                                    >
                                        <Icon name="folder-arrow-in" className="mr-3 color-weak" />
                                        {c('Action').t`Move to another vault`}
                                    </DropdownMenuButton>
                                )}

                                {quickActions}

                                <DropdownMenuButton
                                    className="flex flex-align-items-center text-left"
                                    onClick={handleMoveToTrashClick}
                                >
                                    <Icon name="trash" className="mr-3 color-weak" />
                                    {c('Action').t`Move to Trash`}
                                </DropdownMenuButton>
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
