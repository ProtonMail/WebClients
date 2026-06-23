import type { JSX } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    AppVersion,
    AppsDropdown,
    Loader,
    Sidebar,
    SidebarBackButton,
    SidebarList,
    SidebarNav,
    StartUsingPassSpotlight,
    useAccountSpotlights,
} from '@proton/components';
import { Tree } from '@proton/components/components/sidebar/nav/Tree';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, MEET_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { SidebarToggle } from '@proton/vpn/components/Sidebar/Toggle';
import { useB2BAdminNavigation, useNavigationRef } from '@proton/vpn/contexts/navigation';

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
    const adminSidebar = useB2BAdminNavigation();
    const navigationRef = useNavigationRef();

    const backButtonCopy = {
        [APPS.PROTONMAIL]: c('Navigation').t`Inbox`,
        [APPS.PROTONCALENDAR]: c('Navigation').t`Calendar`,
        [APPS.PROTONDRIVE]: c('Navigation').t`Drive`,
        [APPS.PROTONPASS]: c('Navigation').t`Pass vaults`,
        [APPS.PROTONDOCS]: c('Navigation').t`Documents`,
        [APPS.PROTONWALLET]: c('wallet_signup_2024:Navigation').t`Wallet`,
        [APPS.PROTONMEET]: MEET_SHORT_APP_NAME,
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
        [APPS.PROTONMEET]: c('Navigation').t`Back to ${MEET_SHORT_APP_NAME}`,
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

    const isAdminSidebarEnabled = app === APPS.PROTONVPN_SETTINGS && adminSidebar?.enabled;
    const isB2BAdminActive = app === APPS.PROTONVPN_SETTINGS && adminSidebar?.enabled && adminSidebar.sidebar.status;

    const { pathname } = useLocation();

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
            wide={isAdminSidebarEnabled}
            data-testid="account:sidebar"
            navigationRef={isAdminSidebarEnabled ? navigationRef : null}
        >
            {adminSidebar?.loading ? (
                <Loader />
            ) : (
                <SidebarNav className="overflow-auto">
                    {isB2BAdminActive ? (
                        <Tree routes={adminSidebar.routes} pathname={pathname} />
                    ) : (
                        <SidebarList>
                            <SidebarListWrapper prefix={prefix} {...routes.account} />
                            {app === APPS.PROTONMAIL && <SidebarListWrapper prefix={prefix} {...routes.mail} />}
                            {app === APPS.PROTONCALENDAR && (
                                <CalendarSettingsSidebar prefix={prefix} {...routes.calendar} />
                            )}
                            {app === APPS.PROTONDRIVE && <SidebarListWrapper prefix={prefix} {...routes.drive} />}
                            {app === APPS.PROTONVPN_SETTINGS && <SidebarListWrapper prefix={prefix} {...routes.vpn} />}
                            {app === APPS.PROTONPASS && <SidebarListWrapper prefix={prefix} {...routes.pass} />}
                            {app === APPS.PROTONDOCS && <SidebarListWrapper prefix={prefix} {...routes.docs} />}
                            {app === APPS.PROTONWALLET && <SidebarListWrapper prefix={prefix} {...routes.wallet} />}
                            {app === APPS.PROTONMEET && <SidebarListWrapper prefix={prefix} {...routes.meet} />}
                            {app === APPS.PROTONAUTHENTICATOR && (
                                <SidebarListWrapper prefix={prefix} {...routes.authenticator} />
                            )}
                            {routes.organization.available && (
                                <SidebarListWrapper prefix={prefix} {...routes.organization} />
                            )}
                            {routes.msp.available && <SidebarListWrapper prefix={prefix} {...routes.msp} />}
                        </SidebarList>
                    )}
                </SidebarNav>
            )}
            {isAdminSidebarEnabled ? <SidebarToggle key="sidebar-toggle" adminSidebarFeature={adminSidebar} /> : null}
        </Sidebar>
    );
};

export default AccountSidebar;
