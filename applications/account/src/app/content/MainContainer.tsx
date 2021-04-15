import React, { Suspense, useEffect, useState } from 'react';
import { c } from 'ttag';
import { Route, Redirect, Switch, useLocation } from 'react-router-dom';
import { DEFAULT_APP, getAppFromPathnameSafe, getSlugFromApp } from 'proton-shared/lib/apps/slugHelper';
import { APPS } from 'proton-shared/lib/constants';

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
} from 'react-components';

import AccountOnboardingModal from '../components/AccountOnboardingModal';
import AccountPasswordAndRecoverySettings from '../containers/account/AccountPasswordAndRecoverySettings';
import AccountSecuritySettings from '../containers/account/AccountSecuritySettings';
import AccountPaymentSettings from '../containers/account/AccountPaymentSettings';
import AccountDashboardSettings from '../containers/account/AccountDashboardSettings';
import OrganizationMultiUserSupportSettings from '../containers/organization/OrganizationMultiUserSupportSettings';
import AccountSidebar from './AccountSidebar';
import MailDomainNamesSettings from '../containers/mail/MailDomainNamesSettings';
import OrganizationUsersAndAddressesSettings from '../containers/organization/OrganizationUsersAndAddressesSettings';
import OrganizationKeysSettings from '../containers/organization/OrganizationKeysSettings';

const MailSettingsRouter = React.lazy(() => import('../containers/mail/MailSettingsRouter'));
const CalendarSettingsRouter = React.lazy(() => import('../containers/calendar/CalendarSettingsRouter'));
const ContactsSettingsRouter = React.lazy(() => import('../containers/contacts/ContactsSettingsRouter'));
const VpnSettingsRouter = React.lazy(() => import('../containers/vpn/VpnSettingsRouter'));
const DriveSettingsRouter = React.lazy(() => import('../containers/drive/DriveSettingsRouter'));

const DEFAULT_REDIRECT = `/${getSlugFromApp(DEFAULT_APP)}/dashboard`;

const mailSlug = getSlugFromApp(APPS.PROTONMAIL);
const calendarSlug = getSlugFromApp(APPS.PROTONCALENDAR);
const vpnSlug = getSlugFromApp(APPS.PROTONVPN_SETTINGS);
const driveSlug = getSlugFromApp(APPS.PROTONDRIVE);
const contactsSlug = getSlugFromApp(APPS.PROTONCONTACTS);

const MainContainer = () => {
    const [user] = useUser();
    const location = useLocation();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { isNarrow } = useActiveBreakpoint();
    const [welcomeFlags, setWelcomeFlagDone] = useWelcomeFlags();
    const { createModal } = useModals();

    const [isBlurred, setBlurred] = useState(false);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    useEffect(() => {
        if (welcomeFlags.isWelcomeFlow) {
            createModal(<AccountOnboardingModal onClose={setWelcomeFlagDone} />);
        }
    }, []);

    const app = getAppFromPathnameSafe(location.pathname);

    if (!app) {
        return <Redirect to={DEFAULT_REDIRECT} />;
    }

    const appSlug = getSlugFromApp(app);

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
        <AccountSidebar app={app} appSlug={appSlug} logo={logo} expanded={expanded} onToggleExpand={onToggleExpand} />
    );

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
                <Route path={`/${appSlug}/multi-user-support`}>
                    <OrganizationMultiUserSupportSettings location={location} />
                </Route>
                <Route path={`/${appSlug}/domain-names`}>
                    <MailDomainNamesSettings location={location} />
                </Route>
                ,
                <Route path={`/${appSlug}/organization-keys`}>
                    <OrganizationKeysSettings location={location} />
                </Route>
                ,
                <Route path={`/${appSlug}/users-addresses`}>
                    <OrganizationUsersAndAddressesSettings location={location} />
                </Route>
                <Route path={`/${mailSlug}`}>
                    <Suspense fallback={<LoaderPage />}>
                        <MailSettingsRouter onChangeBlurred={setBlurred} />
                    </Suspense>
                </Route>
                <Route path={`/${calendarSlug}`}>
                    <Suspense fallback={<LoaderPage />}>
                        <CalendarSettingsRouter user={user} />
                    </Suspense>
                </Route>
                <Route path={`/${contactsSlug}`}>
                    <Suspense fallback={<LoaderPage />}>
                        <ContactsSettingsRouter />
                    </Suspense>
                </Route>
                <Route path={`/${vpnSlug}`}>
                    <Suspense fallback={<LoaderPage />}>
                        <VpnSettingsRouter />
                    </Suspense>
                </Route>
                <Route path={`/${driveSlug}`}>
                    <Suspense fallback={<LoaderPage />}>
                        <DriveSettingsRouter />
                    </Suspense>
                </Route>
                <Redirect to={DEFAULT_REDIRECT} />
            </Switch>
        </PrivateAppContainer>
    );
};

export default MainContainer;
