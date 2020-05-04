import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router';
import { withRouter, Redirect, Switch } from 'react-router-dom';
import {
    Sidebar,
    MainAreaContext,
    useToggle,
    usePermissions,
    useUser,
    ErrorBoundary,
    AppVersion,
    useDelinquent
} from 'react-components';
import { hasPermission } from 'proton-shared/lib/helpers/permissions';

import { getPages } from '../../pages';
import PrivateHeader from './PrivateHeader';
import DashboardContainer from '../../containers/DashboardContainer';
import AccountContainer from '../../containers/AccountContainer';
import DownloadsContainer from '../../containers/DownloadsContainer';
import PaymentsContainer from '../../containers/PaymentsContainer';

const PrivateLayout = ({ location }) => {
    const [user] = useUser();
    useDelinquent();
    const mainAreaRef = useRef();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const userPermissions = usePermissions();
    const [activeSection, setActiveSection] = useState('');
    const list = getPages(user)
        .filter(({ permissions: pagePermissions = [] }) => hasPermission(userPermissions, pagePermissions))
        .map(({ text, route: link, icon, sections = [] }) => ({
            text,
            link,
            icon,
            ariaHiddenList: location.pathname !== link,
            list: sections.map(({ text, id }) => ({
                linkClassName: 'navigation__sublink',
                itemClassName: 'navigation__subitem',
                text,
                link: `${link}#${id}`,
                isActive: () => activeSection === id,
                ariaCurrent: activeSection === id ? 'true' : undefined
            }))
        }));

    useEffect(() => {
        setExpand(false);
        mainAreaRef.current.scrollTop = 0;
    }, [location.pathname]);

    return (
        <div className="flex flex-nowrap no-scroll">
            <div className="content flex-item-fluid reset4print">
                <PrivateHeader location={location} expanded={expanded} onToggleExpand={onToggleExpand} />
                <div className="flex flex-nowrap">
                    <Route
                        path="/:path"
                        render={() => (
                            <Sidebar
                                url="/account"
                                expanded={expanded}
                                onToggleExpand={onToggleExpand}
                                list={list}
                                activeSection={activeSection}
                                version={<AppVersion appName="ProtonVPN" />}
                            />
                        )}
                    />
                    <div className="main flex-item-fluid main-area" ref={mainAreaRef}>
                        <div className="flex flex-reverse h100">
                            <MainAreaContext.Provider value={mainAreaRef}>
                                <ErrorBoundary key={location.pathname}>
                                    <Switch>
                                        <Route
                                            path="/dashboard"
                                            exact
                                            render={({ history }) => (
                                                <DashboardContainer
                                                    history={history}
                                                    setActiveSection={setActiveSection}
                                                />
                                            )}
                                        />
                                        <Route
                                            path="/account"
                                            exact
                                            render={({ history }) => (
                                                <AccountContainer
                                                    history={history}
                                                    setActiveSection={setActiveSection}
                                                />
                                            )}
                                        />
                                        <Route
                                            path="/downloads"
                                            exact
                                            render={({ history }) => (
                                                <DownloadsContainer
                                                    history={history}
                                                    setActiveSection={setActiveSection}
                                                />
                                            )}
                                        />
                                        <Route
                                            path="/payments"
                                            exact
                                            render={({ history }) => (
                                                <PaymentsContainer
                                                    history={history}
                                                    setActiveSection={setActiveSection}
                                                />
                                            )}
                                        />
                                        <Redirect to="/dashboard" />
                                    </Switch>
                                </ErrorBoundary>
                            </MainAreaContext.Provider>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

PrivateLayout.propTypes = {
    location: PropTypes.object.isRequired
};

export default withRouter(PrivateLayout);
