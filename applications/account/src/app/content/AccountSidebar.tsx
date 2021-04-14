import React from 'react';
import { c } from 'ttag';
import { Route, Switch } from 'react-router-dom';
import { Sidebar, SidebarNav, SidebarList, SidebarListItem, useUser, SidebarBackButton } from 'react-components';

import MailSettingsSidebarList from '../containers/mail/MailSettingsSidebarList';
import CalendarSettingsSidebarList from '../containers/calendar/CalendarSettingsSidebarList';
import AccountSettingsSidebarList from '../containers/account/AccountSettingsSidebarList';
import ContactsSettingsSidebarList from '../containers/contacts/ContactsSettingsSidebarList';
import OrganizationSettingsSidebarList from '../containers/organization/OrganizationSettingsSidebarList';
import VpnSettingsSidebarList from '../containers/vpn/VpnSettingsSidebarList';
import AccountSidebarVersion from './AccountSidebarVersion';
import { AppSlug, getAppFromSlug } from '../models';

interface AccountSidebarProps {
    originApp: AppSlug;
    logo: JSX.Element;
    expanded: boolean;
    onToggleExpand: () => void;
}

const AccountSidebar = ({ originApp, logo, expanded, onToggleExpand }: AccountSidebarProps) => {
    const [user] = useUser();

    const canHaveOrganization = user.isAdmin && !user.isSubUser;

    const backButtonCopy = {
        mail: c('Navigation').t`Back to Mailbox`,
        calendar: c('Navigation').t`Back to Calendar`,
        contacts: c('Navigation').t`Back to Contacts`,
        vpn: c('Navigation').t`Back to ProtonVPN`,
    };

    const app = getAppFromSlug(originApp);

    return (
        <Sidebar logo={logo} expanded={expanded} onToggleExpand={onToggleExpand} version={<AccountSidebarVersion />}>
            <SidebarNav>
                <SidebarList>
                    {originApp !== 'account' && (
                        <SidebarListItem className="pl1 pb1 pr1">
                            <SidebarBackButton to="/" toApp={app} target="_self">
                                {backButtonCopy[originApp]}
                            </SidebarBackButton>
                        </SidebarListItem>
                    )}
                    <SidebarListItem className="text-uppercase text-left navigation-link-header-group">
                        {c('Settings section title').t`Account`}
                    </SidebarListItem>
                    <AccountSettingsSidebarList prefix={originApp} />
                    <Switch>
                        <Route path="/mail">
                            <MailSettingsSidebarList />
                        </Route>
                        <Route path="/calendar">
                            <CalendarSettingsSidebarList />
                        </Route>
                        <Route path="/contacts">
                            <ContactsSettingsSidebarList />
                        </Route>
                        <Route path="/vpn">
                            <VpnSettingsSidebarList />
                        </Route>
                    </Switch>
                    {canHaveOrganization ? (
                        <>
                            <SidebarListItem className="text-uppercase text-left navigation-link-header-group">
                                Organization
                            </SidebarListItem>
                            <OrganizationSettingsSidebarList prefix={originApp} />
                        </>
                    ) : null}
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );
};

export default AccountSidebar;
