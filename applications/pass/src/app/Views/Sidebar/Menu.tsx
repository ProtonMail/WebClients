import { type FC, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Scroll } from '@proton/atoms/Scroll';
import { Icon } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { AdminPanelBtn } from '@proton/pass/components/Menu/B2B/AdminPanelBtn';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { OnboardingButton } from '@proton/pass/components/Onboarding/Menu/OnboardingButton';
import { useOnboarding } from '@proton/pass/components/Onboarding/OnboardingProvider';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { useMenuItems } from '@proton/pass/hooks/useMenuItems';
import { useNotificationEnhancer } from '@proton/pass/hooks/useNotificationEnhancer';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import {
    selectHasRegisteredLock,
    selectPassPlan,
    selectPlanDisplayName,
    selectUser,
} from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import clsx from '@proton/utils/clsx';

import { useAuthService } from '../../Context/AuthServiceProvider';
import { SettingsDropdown } from '../Settings/SettingsDropdown';

export const Menu: FC<{ onToggle: () => void }> = ({ onToggle }) => {
    const { createNotification, clearNotifications } = useNotifications();
    const enhance = useNotificationEnhancer();
    const onboarding = useOnboarding();

    const authService = useAuthService();
    const menu = useMenuItems({ onAction: onToggle });
    const vaultActions = useVaultActions();

    const { filters, matchTrash } = useNavigation();
    const { selectedShareId } = filters;

    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);
    const user = useSelector(selectUser);
    const canLock = useSelector(selectHasRegisteredLock);

    const b2bAdmin = user && isAdmin(user) && passPlan === UserPassPlan.BUSINESS;

    const onLock = useCallback(async () => {
        createNotification(enhance({ text: c('Info').t`Locking your session...`, type: 'info', loading: true }));
        await authService.lock({ soft: false, broadcast: true });
        clearNotifications();
    }, []);

    return (
        <div className="flex flex-column flex-nowrap justify-space-between flex-1 overflow-auto gap-2">
            <Button
                icon
                size="medium"
                color="norm"
                onClick={vaultActions.create}
                shape="ghost"
                title={c('Action').t`Create a new vault`}
                className="flex items-center justify-space-between flex-nowrap py-2 pl-3 px-2 mx-3"
            >
                <div className="flex text-ellipsis">{c('Label').t`Vaults`}</div>
                <Icon name="plus" alt={c('Action').t`Create a new vault`} />
            </Button>

            <Scroll className="flex flex-1 h-1/2 min-h-custom" style={{ '--min-h-custom': '5em' }}>
                <div className="flex mx-3">
                    <VaultMenu selectedShareId={selectedShareId} inTrash={matchTrash} onSelect={vaultActions.select} />
                </div>
            </Scroll>

            <div className="flex flex-column flex-nowrap pb-4">
                {canLock && (
                    <DropdownMenuButton
                        onClick={onLock}
                        label={c('Action').t`Lock ${PASS_APP_NAME}`}
                        icon="lock"
                        parentClassName="mx-3"
                        className="rounded"
                    />
                )}

                {onboarding.enabled && <OnboardingButton />}

                {b2bAdmin && <AdminPanelBtn />}

                <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                <Submenu
                    icon="bolt"
                    label={c('Action').t`Advanced`}
                    items={menu.advanced}
                    headerClassname="mx-3 pr-2 py-1"
                    contentClassname="mx-3"
                />

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

                <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />

                <div className="flex items-center justify-space-between shrink-0 flex-nowrap gap-2 mt-2 pl-4 pr-2 mx-3">
                    <span className={clsx('flex items-center flex-nowrap', isPaidPlan(passPlan) && 'ui-orange')}>
                        <Icon name="star" className="mr-3 shrink-0" color="var(--interaction-norm)" />
                        <span className="text-left">
                            <div className="text-sm text-ellipsis">{user?.Email}</div>
                            <div className="text-sm" style={{ color: 'var(--interaction-norm)' }}>
                                {planDisplayName}
                            </div>
                        </span>
                    </span>
                    <SettingsDropdown />
                </div>
            </div>
        </div>
    );
};
