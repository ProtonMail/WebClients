import { c } from 'ttag';
import { Sidebar, SidebarNav, SidebarList, SidebarBackButton } from '@proton/components';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';

import AccountSidebarVersion from './AccountSidebarVersion';
import { Routes } from './routes';
import SidebarListWrapper from '../containers/SidebarListWrapper';
import CalendarSettingsSidebar from '../containers/calendar/CalendarSettingsSidebar';

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
        [APPS.PROTONMAIL]: c('Navigation').t`Back to Mail`,
        [APPS.PROTONCALENDAR]: c('Navigation').t`Back to Calendar`,
        [APPS.PROTONDRIVE]: c('Navigation').t`Back to Drive`,
    };

    const backButtonTitle = backButtonCopy[app as keyof typeof backButtonCopy];
    const backButtonText = getAppName(app);
    const prefix = `/${appSlug}`;

    return (
        <Sidebar
            primary={
                backButtonTitle &&
                backButtonText && (
                    <SidebarBackButton to="/" toApp={app} target="_self" title={backButtonTitle}>
                        {backButtonText}
                    </SidebarBackButton>
                )
            }
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            version={<AccountSidebarVersion />}
            data-testid="account:sidebar"
        >
            <SidebarNav>
                <SidebarList>
                    <SidebarListWrapper prefix={prefix} {...routes.account} />
                    {app === APPS.PROTONMAIL && <SidebarListWrapper prefix={prefix} {...routes.mail} />}
                    {app === APPS.PROTONCALENDAR && <CalendarSettingsSidebar prefix={prefix} {...routes.calendar} />}
                    {app === APPS.PROTONDRIVE && <SidebarListWrapper prefix={prefix} {...routes.drive} />}
                    {app === APPS.PROTONVPN_SETTINGS && <SidebarListWrapper prefix={prefix} {...routes.vpn} />}
                    {routes.organization.available && <SidebarListWrapper prefix={prefix} {...routes.organization} />}
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );
};

export default AccountSidebar;
