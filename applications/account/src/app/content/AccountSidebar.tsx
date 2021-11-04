import { c } from 'ttag';
import { Route, Switch } from 'react-router-dom';
import { Sidebar, SidebarNav, SidebarList, SidebarListItem, useUser, SidebarBackButton } from '@proton/components';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';

import MailSettingsSidebarList from '../containers/mail/MailSettingsSidebarList';
import CalendarSettingsSidebarList from '../containers/calendar/CalendarSettingsSidebarList';
import AccountSettingsSidebarList from '../containers/account/AccountSettingsSidebarList';
import ContactsSettingsSidebarList from '../containers/contacts/ContactsSettingsSidebarList';
import OrganizationSettingsSidebarList from '../containers/organization/OrganizationSettingsSidebarList';
import VpnSettingsSidebarList from '../containers/vpn/VpnSettingsSidebarList';
import DriveSettingsSidebarList from '../containers/drive/DriveSettingsSidebarList';
import AccountSidebarVersion from './AccountSidebarVersion';

interface AccountSidebarProps {
    app: APP_NAMES;
    appSlug: string;
    logo: JSX.Element;
    expanded: boolean;
    onToggleExpand: () => void;
}

const mailSlug = getSlugFromApp(APPS.PROTONMAIL);
const calendarSlug = getSlugFromApp(APPS.PROTONCALENDAR);
const vpnSlug = getSlugFromApp(APPS.PROTONVPN_SETTINGS);
const driveSlug = getSlugFromApp(APPS.PROTONDRIVE);
const contactsSlug = getSlugFromApp(APPS.PROTONCONTACTS);

const AccountSidebar = ({ app, appSlug, logo, expanded, onToggleExpand }: AccountSidebarProps) => {
    const [user] = useUser();

    const canHaveOrganization = !user.isMember && !user.isSubUser;

    const backButtonCopy = {
        [APPS.PROTONMAIL]: c('Navigation').t`Back to Mail`,
        [APPS.PROTONCALENDAR]: c('Navigation').t`Back to Calendar`,
        [APPS.PROTONCONTACTS]: c('Navigation').t`Back to Contacts`,
        [APPS.PROTONDRIVE]: c('Navigation').t`Back to Drive`,
    };

    const backButtonText = backButtonCopy[app as keyof typeof backButtonCopy];

    return (
        <Sidebar
            primary={
                backButtonText ? (
                    <SidebarBackButton to="/" toApp={app} target="_self">
                        {backButtonText}
                    </SidebarBackButton>
                ) : null
            }
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            version={<AccountSidebarVersion />}
            data-testid="account:sidebar"
        >
            <SidebarNav>
                <SidebarList>
                    <SidebarListItem className="text-uppercase text-left navigation-link-header-group">
                        {c('Settings section title').t`Account`}
                    </SidebarListItem>
                    <AccountSettingsSidebarList appSlug={appSlug} />
                    <Switch>
                        <Route path={`/${mailSlug}`}>
                            <MailSettingsSidebarList />
                        </Route>
                        <Route path={`/${calendarSlug}`}>
                            <CalendarSettingsSidebarList />
                        </Route>
                        <Route path={`/${contactsSlug}`}>
                            <ContactsSettingsSidebarList />
                        </Route>
                        <Route path={`/${vpnSlug}`}>
                            <VpnSettingsSidebarList />
                        </Route>
                        <Route path={`/${driveSlug}`}>
                            <DriveSettingsSidebarList />
                        </Route>
                    </Switch>
                    {canHaveOrganization ? (
                        <>
                            <SidebarListItem className="text-uppercase text-left navigation-link-header-group">
                                {c('Settings section title').t`Organization`}
                            </SidebarListItem>
                            <OrganizationSettingsSidebarList appSlug={appSlug} />
                        </>
                    ) : null}
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );
};

export default AccountSidebar;
