import React, { Suspense, useEffect, useState } from 'react';
import { c } from 'ttag';
import { useRouteMatch, Route, Redirect, Switch, useLocation } from 'react-router-dom';

import {
    useActiveBreakpoint,
    useToggle,
    PrivateHeader,
    PrivateAppContainer,
    useModals,
    useWelcomeFlags,
    Logo,
    useUser,
    LoaderPage,
    useOrganization,
} from 'react-components';

import AccountOnboardingModal from '../components/AccountOnboardingModal';
import AccountPasswordAndRecoverySettings from '../containers/account/AccountPasswordAndRecoverySettings';
import AccountSecuritySettings from '../containers/account/AccountSecuritySettings';
import AccountPaymentSettings from '../containers/account/AccountPaymentSettings';
import AccountDashboardSettings from '../containers/account/AccountDashboardSettings';
import OrganizationMultiUserSupportSettings from '../containers/organization/OrganizationMultiUserSupportSettings';
import AccountSidebar from './AccountSidebar';
import { ALLOWED_SLUGS, AppSlug, getAppFromSlug } from '../models';
import MailDomainNamesSettings from '../containers/mail/MailDomainNamesSettings';
import OrganizationUsersAndAddressesSettings from '../containers/organization/OrganizationUsersAndAddressesSettings';
import OrganizationKeysSettings from '../containers/organization/OrganizationKeysSettings';

const MailSettingsRouter = React.lazy(() => import('../containers/mail/MailSettingsRouter'));
const CalendarSettingsRouter = React.lazy(() => import('../containers/calendar/CalendarSettingsRouter'));
const ContactsSettingsRouter = React.lazy(() => import('../containers/contacts/ContactsSettingsRouter'));
const VpnSettingsRouter = React.lazy(() => import('../containers/vpn/VpnSettingsRouter'));

const DEFAULT_REDIRECT = '/account/dashboard';

const MainContainer = () => {
    const [user] = useUser();
    const location = useLocation();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { isNarrow } = useActiveBreakpoint();
    const [welcomeFlags, setWelcomeFlagDone] = useWelcomeFlags();
    const { createModal } = useModals();
    const [organization] = useOrganization();

    const [isBlurred, setBlurred] = useState(false);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    useEffect(() => {
        if (welcomeFlags.isWelcomeFlow) {
            createModal(<AccountOnboardingModal onClose={setWelcomeFlagDone} />);
        }
    }, []);

    const match = useRouteMatch<{ appSlug: AppSlug }>('/:appSlug');

    if (!match || !ALLOWED_SLUGS.includes(match?.params?.appSlug)) {
        return <Redirect to={DEFAULT_REDIRECT} />;
    }

    const {
        params: { appSlug },
    } = match;

    const app = getAppFromSlug(appSlug);

    const logo = <Logo appName={app} to="/" toApp={app} target="_self" />;

    const header = (
        <PrivateHeader
            logo={logo}
            title={c('Title').t`Settings`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isNarrow={isNarrow}
        />
    );

    const sidebar = (
        <AccountSidebar originApp={appSlug} logo={logo} expanded={expanded} onToggleExpand={onToggleExpand} />
    );

    const canHaveOrganization = user && !user.isMember;

    const hasOrganization = organization?.HasKeys;

    return (
        <PrivateAppContainer header={header} sidebar={sidebar} isBlurred={isBlurred || welcomeFlags.isWelcomeFlow}>
            <Switch>
                <Route path={`/${appSlug}/dashboard`}>
                    <AccountDashboardSettings location={location} setActiveSection={() => {}} />
                </Route>
                <Route path={`/${appSlug}/authentication`}>
                    <AccountPasswordAndRecoverySettings location={location} setActiveSection={() => {}} user={user} />
                </Route>
                <Route path={`/${appSlug}/payment`}>
                    <AccountPaymentSettings location={location} setActiveSection={() => {}} />
                </Route>
                <Route path={`/${appSlug}/security`}>
                    <AccountSecuritySettings location={location} setActiveSection={() => {}} />
                </Route>
                {canHaveOrganization ? (
                    <Route path={`/${appSlug}/multi-user-support`}>
                        <OrganizationMultiUserSupportSettings location={location} />
                    </Route>
                ) : null}
                {canHaveOrganization && hasOrganization
                    ? [
                          <Route key="0" path={`/${appSlug}/domain-names`}>
                              <MailDomainNamesSettings location={location} />
                          </Route>,
                          <Route key="1" path={`/${appSlug}/organization-keys`}>
                              <OrganizationKeysSettings location={location} />
                          </Route>,
                          <Route key="2" path={`/${appSlug}/users-addresses`}>
                              <OrganizationUsersAndAddressesSettings location={location} />
                          </Route>,
                      ]
                    : null}
                <Route path="/mail">
                    <Suspense fallback={<LoaderPage />}>
                        <MailSettingsRouter onChangeBlurred={setBlurred} />
                    </Suspense>
                </Route>
                <Route path="/calendar">
                    <Suspense fallback={<LoaderPage />}>
                        <CalendarSettingsRouter user={user} />
                    </Suspense>
                </Route>
                <Route path="/contacts">
                    <Suspense fallback={<LoaderPage />}>
                        <ContactsSettingsRouter />
                    </Suspense>
                </Route>
                <Route path="/vpn">
                    <Suspense fallback={<LoaderPage />}>
                        <VpnSettingsRouter />
                    </Suspense>
                </Route>
                <Redirect to={DEFAULT_REDIRECT} />
            </Switch>
        </PrivateAppContainer>
    );
};

export default MainContainer;
