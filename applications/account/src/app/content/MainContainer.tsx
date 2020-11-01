import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import {
    Sidebar,
    SidebarNav,
    SidebarList,
    SidebarListItemsWithSubsections,
    useActiveBreakpoint,
    useToggle,
    useUser,
    PrivateHeader,
    PrivateAppContainer,
    MainLogo,
    useOrganization,
    useModals,
    useWelcomeFlags,
} from 'react-components';

import { getPages } from '../pages';
import OrganizationContainer from '../containers/OrganizationContainer';
import SubscriptionContainer from '../containers/SubscriptionContainer';
import AccountContainer from '../containers/AccountContainer';
import GeneralContainer from '../containers/GeneralContainer';
import SecurityContainer from '../containers/SecurityContainer';
import OverviewContainer from '../containers/OverviewContainer';
import SidebarVersion from './SidebarVersion';
import AccountOnboardingModal from '../components/AccountOnboardingModal';

const MainContainer = () => {
    const [user] = useUser();
    const location = useLocation();
    const [organization] = useOrganization();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const [activeSection, setActiveSection] = useState('');
    const { isNarrow } = useActiveBreakpoint();
    const [welcomeFlags, setWelcomeFlagDone] = useWelcomeFlags();
    const { createModal } = useModals();

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    useEffect(() => {
        if (welcomeFlags.isWelcomeFlow) {
            createModal(<AccountOnboardingModal onClose={setWelcomeFlagDone} />);
        }
    }, []);

    const logo = <MainLogo to="/" />;

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
        <Sidebar logo={logo} expanded={expanded} onToggleExpand={onToggleExpand} version={<SidebarVersion />}>
            <SidebarNav>
                <SidebarList>
                    <SidebarListItemsWithSubsections
                        list={getPages(user, organization)}
                        pathname={location.pathname}
                        activeSection={activeSection}
                    />
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );

    return (
        <PrivateAppContainer header={header} sidebar={sidebar} isBlurred={welcomeFlags.isWelcomeFlow}>
            <Switch>
                <Route path="/overview">
                    <OverviewContainer />
                </Route>
                <Route path="/account">
                    <AccountContainer location={location} setActiveSection={setActiveSection} user={user} />
                </Route>
                <Route path="/organization/:memberID?">
                    <OrganizationContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Route path="/subscription">
                    <SubscriptionContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Route path="/general">
                    <GeneralContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Route path="/security">
                    <SecurityContainer location={location} setActiveSection={setActiveSection} />
                </Route>
                <Redirect to="/overview" />
            </Switch>
        </PrivateAppContainer>
    );
};

export default MainContainer;
