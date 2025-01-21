import { type FC } from 'react';

import { AccountActions } from 'proton-pass-web/app/Views/Sidebar/AccountActions';
import { AuthActions } from 'proton-pass-web/app/Views/Sidebar/AuthActions';
import { OnboardingActions } from 'proton-pass-web/app/Views/Sidebar/OnboardingActions';
import { OrganizationActions } from 'proton-pass-web/app/Views/Sidebar/OrganizationActions';
import { c } from 'ttag';

import { Button, Scroll } from '@proton/atoms';
import { Icon } from '@proton/components';
import { MonitorButton } from '@proton/pass/components/Menu/Monitor/MonitorButton';
import { SharedMenu } from '@proton/pass/components/Menu/Shared/SharedMenu';
import { Submenu } from '@proton/pass/components/Menu/Submenu';
import { VaultMenu } from '@proton/pass/components/Menu/Vault/VaultMenu';
import { RouteMatch } from '@proton/pass/components/Navigation/RouteMatch';
import { getMonitorRoute } from '@proton/pass/components/Navigation/routing';
import { InAppNotificationContainer } from '@proton/pass/components/Notifications/InAppNotificationPortal';
import { useVaultActions } from '@proton/pass/components/Vault/VaultActionsProvider';
import { useMenuItems } from '@proton/pass/hooks/useMenuItems';

import { MenuActions } from './MenuActions';

export const Menu: FC<{ onToggle: () => void }> = ({ onToggle }) => {
    const menu = useMenuItems({ onAction: onToggle });
    const vaultActions = useVaultActions();

    return (
        <div className="flex flex-column flex-nowrap justify-space-between flex-1 overflow-auto">
            <Scroll className="flex flex-1 h-1/2 min-h-custom" style={{ '--min-h-custom': '5em' }}>
                <div className="flex mx-3 gap-5 pb-2">
                    <div className="flex flex-column gap-2 w-full">
                        <Button
                            icon
                            size="medium"
                            color="norm"
                            onClick={vaultActions.create}
                            shape="ghost"
                            title={c('Action').t`Create a new vault`}
                            className="flex items-center justify-space-between flex-nowrap py-2 pl-3 px-2 w-full"
                        >
                            <div className="flex text-ellipsis">{c('Label').t`Vaults`}</div>
                            <Icon name="plus" alt={c('Action').t`Create a new vault`} />
                        </Button>
                        <VaultMenu />
                    </div>

                    <SharedMenu />
                </div>
            </Scroll>

            <div className="flex flex-column flex-nowrap pb-2">
                <hr className="mb-2 mx-4" aria-hidden="true" />

                <OnboardingActions />

                <RouteMatch path={getMonitorRoute()} component={MonitorButton} />

                <OrganizationActions />

                <hr className="my-2 mx-4" aria-hidden="true" />

                <AuthActions />

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

                <div className="shrink-0">
                    <InAppNotificationContainer className="px-4 py-2" />

                    <hr className="my-2 mx-4" aria-hidden="true" />

                    <div className="flex justify-space-between items-center flex-nowrap gap-1 pl-3 pr-5">
                        <AccountActions />
                        <MenuActions />
                    </div>
                </div>
            </div>
        </div>
    );
};
