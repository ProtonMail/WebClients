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
} from 'react-components';

import { getPages } from '../pages';
import OrganizationContainer from '../containers/OrganizationContainer';
import SubscriptionContainer from '../containers/SubscriptionContainer';
import AccountContainer from '../containers/AccountContainer';
import GeneralContainer from '../containers/GeneralContainer';
import SecurityContainer from '../containers/SecurityContainer';
import SidebarVersion from './SidebarVersion';

const PrivateLayout = () => {
    const [user] = useUser();
    const location = useLocation();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const [activeSection, setActiveSection] = useState('');
    const { isNarrow } = useActiveBreakpoint();

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

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
                        list={getPages(user)}
                        pathname={location.pathname}
                        activeSection={activeSection}
                    />
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );

    return (
        <PrivateAppContainer header={header} sidebar={sidebar}>
            <Switch>
                <Route path="/" exact render={() => 'Overview'} />
                <Route
                    path="/account"
                    render={({ location }) => (
                        <AccountContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path="/organization"
                    render={({ location }) => (
                        <OrganizationContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path="/subscription"
                    render={({ location }) => (
                        <SubscriptionContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path="/general"
                    render={({ location }) => (
                        <GeneralContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path="/security"
                    render={({ location }) => (
                        <SecurityContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Redirect to="/" />
            </Switch>
        </PrivateAppContainer>
    );
};

export default PrivateLayout;
