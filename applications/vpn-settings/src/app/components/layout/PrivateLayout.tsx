import React, { useEffect, useState } from 'react';
import { Route } from 'react-router';
import { withRouter, Redirect, Switch, RouteComponentProps } from 'react-router-dom';
import {
    Sidebar,
    useToggle,
    usePermissions,
    useUser,
    AppVersion,
    getSectionConfigProps,
    PrivateAppContainer
} from 'react-components';
import { hasPermission } from 'proton-shared/lib/helpers/permissions';

import { getPages } from '../../pages';
import PrivateHeader from './PrivateHeader';
import DashboardContainer from '../../containers/DashboardContainer';
import AccountContainer from '../../containers/AccountContainer';
import DownloadsContainer from '../../containers/DownloadsContainer';
import PaymentsContainer from '../../containers/PaymentsContainer';

const PrivateLayout = ({ location }: RouteComponentProps) => {
    const [user] = useUser();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const userPermissions = usePermissions();
    const [activeSection, setActiveSection] = useState('');
    const filteredPages = getPages(user).filter(({ permissions: pagePermissions = [] }) =>
        hasPermission(userPermissions, pagePermissions)
    );
    const list = getSectionConfigProps(filteredPages, location.pathname, activeSection);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname]);

    const header = <PrivateHeader location={location} expanded={expanded} onToggleExpand={onToggleExpand} />;

    const sidebar = (
        <Sidebar
            url="/account"
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            list={list}
            version={<AppVersion appName="ProtonVPN" />}
        />
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
