import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { Route, Switch, withRouter, RouteComponentProps } from 'react-router-dom';
import { Redirect } from 'react-router';
import {
    Sidebar,
    SidebarNav,
    SidebarList,
    SidebarListItemsWithSubsections,
    useActiveBreakpoint,
    useToggle,
    useUser,
    PrivateHeader,
    PrivateAppContainer
} from 'react-components';

import { getPages } from '../pages';
import OrganizationContainer from '../containers/OrganizationContainer';
import SubscriptionContainer from '../containers/SubscriptionContainer';
import AccountContainer from '../containers/AccountContainer';
import GeneralContainer from '../containers/GeneralContainer';
import SecurityContainer from '../containers/SecurityContainer';
import SidebarVersion from './SidebarVersion';

const PrivateLayout = ({ location }: RouteComponentProps) => {
    const [user] = useUser();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const [activeSection, setActiveSection] = useState('');
    const { isNarrow } = useActiveBreakpoint();

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    const base = '/';

    const header = (
        <PrivateHeader
            url={base}
            title={c('Title').t`Settings`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isNarrow={isNarrow}
        />
    );

    const sidebar = (
        <Sidebar url={base} expanded={expanded} onToggleExpand={onToggleExpand} version={<SidebarVersion />}>
            <SidebarNav>
                <SidebarList>
                    <SidebarListItemsWithSubsections
                        list={getPages(user)}
                        pathname={window.location.pathname}
                        activeSection={activeSection}
                    />
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );

    return (
        <PrivateAppContainer header={header} sidebar={sidebar}>
            <Switch>
                <Route path={base} exact render={() => 'Overview'} />
                <Route
                    path={`${base}/account`}
                    render={({ location }) => (
                        <AccountContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path={`${base}/organization`}
                    render={({ location }) => (
                        <OrganizationContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path={`${base}/subscription`}
                    render={({ location }) => (
                        <SubscriptionContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path={`${base}/general`}
                    render={({ location }) => (
                        <GeneralContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path={`${base}/security`}
                    render={({ location }) => (
                        <SecurityContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Redirect to={base} />
            </Switch>
        </PrivateAppContainer>
    );
};

export default withRouter(PrivateLayout);
