import { type FC, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { AccountSwitcherTooltip } from 'proton-pass-web/app/Auth/AccountSwitcher';
import { useAuthService } from 'proton-pass-web/app/Auth/AuthServiceProvider';
import { checkAuthSwitch, useAvailableSessions } from 'proton-pass-web/app/Auth/AuthSwitchProvider';
import { c } from 'ttag';

import { Button, ButtonLike, Scroll } from '@proton/atoms';
import { Icon } from '@proton/components';
import { UserPanel } from '@proton/pass/components/Account/UserPanel';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { AdminPanelButton } from '@proton/pass/components/Menu/B2B/AdminPanelButton';
import { OnboardingButton } from '@proton/pass/components/Menu/B2B/OnboardingButton';
import { MonitorButton } from '@proton/pass/components/Menu/Monitor/MonitorButton';
import { SecureLinkButton } from '@proton/pass/components/Menu/SecureLink/SecureLinkButton';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { useNavigation } from '@proton/pass/components/Navigation/NavigationProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useOnboarding } from '@proton/pass/components/Onboarding/OnboardingProvider';
import { useOrganization } from '@proton/pass/components/Organization/OrganizationProvider';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { useFeatureFlag } from '@proton/pass/hooks/useFeatureFlag';
import { useMenuItems } from '@proton/pass/hooks/useMenuItems';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { selectLockMode, selectPassPlan, selectPlanDisplayName, selectUser } from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { MenuActions } from './MenuActions';

export const Menu: FC<{ onToggle: () => void }> = ({ onToggle }) => {
    const authService = useAuthService();
    const onboarding = useOnboarding();
    const org = useOrganization();

    const menu = useMenuItems({ onAction: onToggle });
    const vaultActions = useVaultActions();

    const accountSwitchEnabled = useFeatureFlag(PassFeature.PassAccountSwitchV1);
    const authSwitchEnabled = useMemo(() => accountSwitchEnabled || checkAuthSwitch(), [accountSwitchEnabled]);
    const sessions = useAvailableSessions();

    const { navigate, filters, matchTrash } = useNavigation();
    const { selectedShareId } = filters;

    const user = useSelector(selectUser);
    const lockMode = useSelector(selectLockMode);
    const passPlan = useSelector(selectPassPlan);
    const planDisplayName = useSelector(selectPlanDisplayName);

    const canLock = lockMode !== LockMode.NONE;

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

            <div className="flex flex-column flex-nowrap pb-2">
                <SecureLinkButton
                    className="rounded"
                    activeClassName="color-primary bg-weak"
                    parentClassName="mx-3"
                    onClick={() => navigate(getLocalPath('secure-links'))}
                />
                {canLock && (
                    <DropdownMenuButton
                        onClick={() =>
                            authService.lock(lockMode, {
                                broadcast: true,
                                soft: false,
                                userInitiated: true,
                            })
                        }
                        label={c('Action').t`Lock ${PASS_APP_NAME}`}
                        icon="lock"
                        parentClassName="mx-3"
                        className="rounded"
                    />
                )}
                {onboarding.enabled && <OnboardingButton />}
                {org && org.b2bAdmin && <AdminPanelButton {...org.organization} />}
                <hr className="dropdown-item-hr my-2 mx-4" aria-hidden="true" />
                <MonitorButton />
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

                <div className="flex justify-space-between items-center flex-nowrap gap-1 pl-3 pr-5">
                    <AccountSwitcherTooltip sessions={authSwitchEnabled ? sessions : []}>
                        {({ anchorRef, toggle }) => (
                            <ButtonLike ref={anchorRef} onClick={toggle} shape="ghost" className="flex-1" size="small">
                                <UserPanel
                                    email={user?.Email ?? ''}
                                    name={user?.DisplayName ?? ''}
                                    plan={passPlan}
                                    planName={planDisplayName}
                                />
                            </ButtonLike>
                        )}
                    </AccountSwitcherTooltip>
                    <MenuActions />
                </div>
            </div>
        </div>
    );
};
