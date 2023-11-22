import { type FC, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Scroll } from '@proton/atoms/Scroll';
import { Icon } from '@proton/components/components';
import { useNavigation } from '@proton/pass/components/Core/NavigationProvider';
import { getLocalPath, getTrashRoute } from '@proton/pass/components/Core/routing';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { usePasswordContext } from '@proton/pass/components/PasswordGenerator/PasswordContext';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { useMenuItems } from '@proton/pass/hooks/useMenuItems';
import { syncIntent } from '@proton/pass/store/actions';
import { selectPassPlan, selectPlanDisplayName, selectUser } from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import clsx from '@proton/utils/clsx';

import { useAuthService } from '../../Context/AuthServiceProvider';

export const Menu: FC<{ onToggle: () => void }> = ({ onToggle }) => {
    const authService = useAuthService();
    const menu = useMenuItems({ onAction: onToggle });
    const vaultActions = useVaultActions();

    const { openPasswordHistory } = usePasswordContext();
    const dispatch = useDispatch();

    const { filters, matchEmpty, matchTrash, navigate, setFilters } = useNavigation();
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
        <div className="flex flex-column flex-nowrap flex-justify-space-between flex-item-fluid scroll-if-needed gap-2">
            <Button
                icon
                size="medium"
                color="norm"
                onClick={vaultActions.create}
                shape="ghost"
                title={c('Action').t`Create a new vault`}
                className="flex flex-align-items-center flex-justify-space-between flex-nowrap py-2 pl-3 px-2 mx-3"
            >
                <div className="flex text-ellipsis">{c('Label').t`Vaults`}</div>
                <Icon name="plus" alt={c('Action').t`Create a new vault`} />
            </Button>

            <Scroll className="flex flex-item-fluid h-1/2 min-h-custom" style={{ '--min-h-custom': '5em' }}>
                <div className="flex mx-3">
                    <VaultMenu selectedShareId={selectedShareId} inTrash={matchTrash} onSelect={onVaultSelect} />
                </div>
            </Scroll>

            <div className="flex flex-column flex-nowrap pb-4">
                <DropdownMenuButton
                    onClick={openPasswordHistory}
                    label={c('Label').t`Generated passwords`}
                    icon={'key-history'}
                    labelClassname="mx-3"
                    className="flex-noshrink"
                />

                <DropdownMenuButton
                    label={c('Label').t`Manually sync your data`}
                    icon={'arrow-rotate-right'}
                    labelClassname="mx-3"
                    onClick={() => dispatch(syncIntent())}
                />

                <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                <Submenu
                    icon="bug"
                    label={c('Action').t`Feedback`}
                    items={menu.feedback}
                    headerClassname="mx-3 pr-2 py-1"
                    contentClassname="mx-3"
                />

                <Submenu
                    icon="mobile"
                    label={c('Action').t`Get mobile apps`}
                    items={menu.download}
                    headerClassname="mx-3 pr-2 py-1"
                    contentClassname="mx-3"
                />

                <DropdownMenuButton
                    icon="arrow-out-from-rectangle"
                    label={c('Action').t`Sign out`}
                    labelClassname="mx-3"
                    onClick={() => authService.logout({ soft: false })}
                />

                <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                <div className="flex flex-align-items-center flex-justify-space-between flex-item-noshrink flex-nowrap gap-2 mt-2 pl-4 pr-2 mx-3">
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
                        pill
                        size="small"
                        color="weak"
                        onClick={() => navigate(getLocalPath('settings'))}
                        shape="ghost"
                        title={c('Action').t`Settings`}
                        className="flex-item-noshrink ml-1"
                    >
                        <Icon name="cog-wheel" alt={c('Action').t`Settings`} />
                    </Button>
                </div>
            </div>
        </div>
    );
};
