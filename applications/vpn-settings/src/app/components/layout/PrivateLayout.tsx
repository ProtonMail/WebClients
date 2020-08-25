import React, { useEffect, useState } from 'react';
import { Route } from 'react-router';
import { withRouter, Redirect, Switch, RouteComponentProps } from 'react-router-dom';
import {
    Sidebar,
    useToggle,
    usePermissions,
    useUser,
    AppVersion,
    PrivateAppContainer,
    PrivateHeader,
    useActiveBreakpoint,
    SidebarList,
    SidebarNav,
    SidebarListItemsWithSubsections,
    MainLogo
} from 'react-components';
import { hasPermission } from 'proton-shared/lib/helpers/permissions';
import { c } from 'ttag';

import { getPages } from '../../pages';
import DashboardContainer from '../../containers/DashboardContainer';
import GeneralContainer from '../../containers/GeneralContainer';
import AccountContainer from '../../containers/AccountContainer';
import DownloadsContainer from '../../containers/DownloadsContainer';
import PaymentsContainer from '../../containers/PaymentsContainer';

const PrivateLayout = ({ location }: RouteComponentProps) => {
    const [user] = useUser();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const userPermissions = usePermissions();
    const { isNarrow } = useActiveBreakpoint();

    const [activeSection, setActiveSection] = useState('');
    const filteredPages = getPages(user).filter(({ permissions: pagePermissions = [] }) =>
        hasPermission(userPermissions, pagePermissions)
    );

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
            hasAppsDropdown={false}
        />
    );

    const sidebar = (
        <Sidebar logo={logo} expanded={expanded} onToggleExpand={onToggleExpand} version={<AppVersion />}>
            <SidebarNav>
                <SidebarList>
                    <SidebarListItemsWithSubsections
                        list={filteredPages}
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
                <Route
                    path="/dashboard"
                    exact
                    render={({ location }) => (
                        <DashboardContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path="/general"
                    exact
                    render={({ location }) => (
                        <GeneralContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path="/account"
                    exact
                    render={({ location }) => (
                        <AccountContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path="/downloads"
                    exact
                    render={({ location }) => (
                        <DownloadsContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Route
                    path="/payments"
                    exact
                    render={({ location }) => (
                        <PaymentsContainer location={location} setActiveSection={setActiveSection} />
                    )}
                />
                <Redirect to="/dashboard" />
            </Switch>
        </PrivateAppContainer>
    );
};

export default withRouter(PrivateLayout);
