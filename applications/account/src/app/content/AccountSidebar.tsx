import type { JSX } from 'react';

import { c } from 'ttag';

import {
    AppVersion,
    AppsDropdown,
    Sidebar,
    SidebarBackButton,
    SidebarList,
    SidebarNav,
    StartUsingPassSpotlight,
    useAccountSpotlights,
} from '@proton/components';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import SidebarListWrapper from '../containers/SidebarListWrapper';
import CalendarSettingsSidebar from '../containers/calendar/CalendarSettingsSidebar';
import type { Routes } from './routes';

interface AccountSidebarProps {
    app: APP_NAMES;
    appSlug: string;
    logo: JSX.Element;
    expanded: boolean;
    onToggleExpand: () => void;
    routes: Routes;
}

const AccountSidebar = ({ app, appSlug, logo, expanded, onToggleExpand, routes }: AccountSidebarProps) => {
    const backButtonCopy = {
        [APPS.PROTONMAIL]: c('Navigation').t`Inbox`,
        [APPS.PROTONCALENDAR]: c('Navigation').t`Calendar`,
        [APPS.PROTONDRIVE]: c('Navigation').t`Drive`,
        [APPS.PROTONPASS]: c('Navigation').t`Pass vaults`,
        [APPS.PROTONDOCS]: c('Navigation').t`Documents`,
        [APPS.PROTONWALLET]: c('wallet_signup_2024:Navigation').t`Wallet`,
        [APPS.PROTONLUMO]: c('collider_2025: Navigation').t`Conversations`,
    };
    const backButtonCopyTitle = {
        [APPS.PROTONMAIL]: c('Navigation').t`Back to inbox`,
        [APPS.PROTONCALENDAR]: c('Navigation').t`Back to calendar`,
        [APPS.PROTONDRIVE]: c('Navigation').t`Back to files`,
        [APPS.PROTONPASS]: c('Navigation').t`Back to vaults`,
        [APPS.PROTONDOCS]: c('Navigation').t`Back to documents`,
        [APPS.PROTONWALLET]: c('wallet_signup_2024:Navigation').t`Back to wallet`,
        [APPS.PROTONLUMO]: c('collider_2025: Navigation').t`Back to conversations`,
    };

    const backButtonText = backButtonCopy[app as keyof typeof backButtonCopy];
    const backButtonTitle = backButtonCopyTitle[app as keyof typeof backButtonCopyTitle];
    const prefix = `/${appSlug}`;

    const {
        passOnboardingSpotlights: { startUsingPassSpotlight },
    } = useAccountSpotlights();

    const handleClick = () => {
        if (app === APPS.PROTONPASS) {
            startUsingPassSpotlight.close();
        }
    };

    return (
        <Sidebar
            app={app}
            appsDropdown={<AppsDropdown app={app} />}
            primary={
                backButtonTitle &&
                backButtonText && (
                    <StartUsingPassSpotlight app={app}>
                        <SidebarBackButton
                            to="/"
                            toApp={app}
                            target="_self"
                            title={backButtonTitle}
                            aria-label={backButtonTitle}
                            data-testid={`account:back-to-app`}
                            onClick={handleClick}
                        >
                            {backButtonText}
                        </SidebarBackButton>
                    </StartUsingPassSpotlight>
                )
            }
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            version={<AppVersion />}
            data-testid="account:sidebar"
        >
            <SidebarNav>
                <SidebarList>
                    <SidebarListWrapper prefix={prefix} {...routes.account} />
                    {app === APPS.PROTONMAIL && <SidebarListWrapper prefix={prefix} {...routes.mail} />}
                    {app === APPS.PROTONCALENDAR && <CalendarSettingsSidebar prefix={prefix} {...routes.calendar} />}
                    {app === APPS.PROTONDRIVE && <SidebarListWrapper prefix={prefix} {...routes.drive} />}
                    {app === APPS.PROTONVPN_SETTINGS && <SidebarListWrapper prefix={prefix} {...routes.vpn} />}
                    {app === APPS.PROTONPASS && <SidebarListWrapper prefix={prefix} {...routes.pass} />}
                    {app === APPS.PROTONDOCS && <SidebarListWrapper prefix={prefix} {...routes.docs} />}
                    {app === APPS.PROTONWALLET && <SidebarListWrapper prefix={prefix} {...routes.wallet} />}
                    {routes.organization.available && <SidebarListWrapper prefix={prefix} {...routes.organization} />}
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );
};

export default AccountSidebar;
