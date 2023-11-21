import { type FC, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Scroll } from '@proton/atoms/Scroll';
import { Icon } from '@proton/components/components';
import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { getLocalPath, getTrashRoute } from '@proton/pass/components/Core/routing';
import { UpgradeButton } from '@proton/pass/components/Layout/Button/UpgradeButton';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { usePasswordContext } from '@proton/pass/components/PasswordGenerator/PasswordContext';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { useMenuItems } from '@proton/pass/hooks/useMenuItems';
import { selectPassPlan, selectPlanDisplayName, selectUser } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import clsx from '@proton/utils/clsx';

import { useAuthService } from '../../Context/AuthServiceProvider';

export const SidebarMenu: FC<{ onToggle: () => void }> = ({ onToggle }) => {
    const menu = useMenuItems({ onAction: onToggle });
    const authService = useAuthService();
    const { openPasswordHistory } = usePasswordContext();
    const vaultActions = useVaultActions();

    const { filters, matchEmpty, matchTrash, setFilters } = useNavigation();
    const { selectedShareId } = filters;

    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const user = useSelector(selectUser);

    const onVaultSelect = useCallback(
        (selected: string) => {
            switch (selected) {
                case 'all':
                    return setFilters({ selectedShareId: null, search: '' }, matchEmpty ? getLocalPath() : undefined);
                case 'trash':
                    return setFilters({ selectedShareId: null, search: '' }, getTrashRoute());
                default: {
                    return setFilters({ selectedShareId: selected }, getLocalPath());
                }
            }
        },
        [setFilters, matchEmpty]
    );

    return (
        <div className="flex flex-column flex-nowrap flex-justify-space-between flex-item-fluid">
            <div className="flex flex-align-items-center flex-justify-space-between flex-nowrap p-3">
                <div className="flex text-sm text-ellipsis">{c('Label').t`Vaults`}</div>
                <Button
                    icon
                    size="small"
                    color="norm"
                    onClick={vaultActions.create}
                    shape="ghost"
                    title={c('Action').t`Create a new vault`}
                >
                    <Icon name="plus" alt={c('Action').t`Create a new vault`} />
                </Button>
            </div>

            <Scroll className="flex flex-item-fluid h-1/2">
                <div className="flex">
                    <VaultMenu selectedShareId={selectedShareId} inTrash={matchTrash} onSelect={onVaultSelect} />
                </div>
            </Scroll>

            <div>
                <DropdownMenuButton
                    onClick={() => {}}
                    label={c('Label').t`Settings`}
                    labelClassname="flex-item-fluid"
                    icon={'cog-wheel'}
                />

                <DropdownMenuButton
                    onClick={openPasswordHistory}
                    label={c('Label').t`Generated passwords`}
                    labelClassname="flex-item-fluid"
                    icon={'key-history'}
                />

                <DropdownMenuButton
                    onClick={() => {}}
                    label={c('Label').t`Manually sync your data`}
                    labelClassname="flex-item-fluid"
                    icon={'arrow-rotate-right'}
                />

                <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                <Submenu icon="bug" label={c('Action').t`Feedback`} items={menu.feedback} />

                <DropdownMenuButton
                    onClick={() => authService.logout({ soft: false })}
                    label={c('Action').t`Sign out`}
                    icon="arrow-out-from-rectangle"
                />

                <div className="flex flex-align-items-center flex-justify-space-between flex-item-fluid flex-nowrap gap-2 py-2 px-4">
                    <span
                        className={clsx(
                            'flex flex-align-items-center flex-nowrap flex-item-noshrink',
                            passPlan === UserPassPlan.PLUS && 'ui-orange'
                        )}
                    >
                        <Icon name="star" className="mr-3" color="var(--interaction-norm)" />
                        <span className="text-left">
                            <div className="text-sm text-ellipsis">{user?.Email}</div>
                            <div className="text-sm" style={{ color: 'var(--interaction-norm)' }}>
                                {planDisplayName}
                            </div>
                        </span>
                    </span>
                    <Button
                        icon
                        size="small"
                        color="weak"
                        onClick={() => {}}
                        shape="ghost"
                        title={c('Action').t`Settings`}
                        className="flex-item-noshrink ml-1"
                    >
                        <Icon name="cog-wheel" alt={c('Action').t`Settings`} />
                    </Button>
                </div>

                <div className="pb-2 px-4">
                    <UpgradeButton className="w-full" />
                </div>
            </div>
        </div>
    );
};
