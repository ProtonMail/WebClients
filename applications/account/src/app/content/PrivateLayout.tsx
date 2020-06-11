import React, { useRef, useState, useEffect } from 'react';
import { c } from 'ttag';
import { Route, Switch, withRouter, RouteComponentProps } from 'react-router-dom';
import { Redirect } from 'react-router';
import { Sidebar, MainAreaContext, ErrorBoundary, useToggle, useUser } from 'react-components';

import { getPages } from '../pages';
import PrivateHeader from './PrivateHeader';
import OrganizationContainer from '../containers/OrganizationContainer';
import MembersContainer from '../containers/MembersContainer';
import SubscriptionContainer from '../containers/SubscriptionContainer';
import AccountContainer from '../containers/AccountContainer';
import GeneralContainer from '../containers/GeneralContainer';
import SecurityContainer from '../containers/SecurityContainer';
import SidebarVersion from './SidebarVersion';

const PrivateLayout = ({ location }: RouteComponentProps) => {
    const [user] = useUser();
    const mainAreaRef = useRef<HTMLDivElement>();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const [activeSection, setActiveSection] = useState('');
    const list = getPages(user).map(({ text, route: link, icon, sections = [] }) => ({
        text,
        link,
        icon,
        ariaHiddenList: location.pathname !== link,
        list: sections.map(({ text, id }: { text: string; id: string }) => ({
            linkClassName: 'navigation__sublink',
            itemClassName: 'navigation__subitem',
            text,
            link: `${link}#${id}`,
            isActive: () => activeSection === id,
            ariaCurrent: activeSection === id ? 'true' : undefined
        }))
    }));

    const mobileLinks = [
        { to: '/inbox', icon: 'protonmail', external: true, current: true },
        { to: '/contacts', icon: 'protoncontacts', external: true, current: false },
        { to: '/calendar', icon: 'protoncalendar', external: true, current: false }
    ].filter(Boolean);

    useEffect(() => {
        setExpand(false);
        if (mainAreaRef && mainAreaRef.current) {
            mainAreaRef.current.scrollTop = 0;
        }
    }, [location.pathname]);

    return (
        <div className="flex flex-nowrap no-scroll">
            <div className="content flex-item-fluid reset4print">
                <PrivateHeader title={c('Title').t`Settings`} expanded={expanded} onToggleExpand={onToggleExpand} />
                <div className="flex flex-nowrap">
                    <Route
                        path="/:path"
                        render={() => (
                            <Sidebar
                                url="/inbox"
                                version={<SidebarVersion />}
                                mobileLinks={mobileLinks}
                                expanded={expanded}
                                onToggleExpand={onToggleExpand}
                                list={list}
                            />
                        )}
                    />
                    <div className="main flex-item-fluid main-area" ref={mainAreaRef}>
                        <div className="flex flex-reverse h100">
                            <MainAreaContext.Provider value={mainAreaRef}>
                                <ErrorBoundary key={location.pathname}>
                                    <Switch>
                                        <Route path="/settings" exact render={() => 'Overview'} />
                                        <Route
                                            path="/settings/account"
                                            render={() => <AccountContainer setActiveSection={setActiveSection} />}
                                        />
                                        <Route
                                            path="/settings/organization"
                                            render={() => <OrganizationContainer setActiveSection={setActiveSection} />}
                                        />
                                        <Route
                                            path="/settings/members"
                                            render={() => <MembersContainer setActiveSection={setActiveSection} />}
                                        />
                                        <Route
                                            path="/settings/subscription"
                                            render={() => <SubscriptionContainer setActiveSection={setActiveSection} />}
                                        />
                                        <Route
                                            path="/settings/general"
                                            render={() => <GeneralContainer setActiveSection={setActiveSection} />}
                                        />
                                        <Route
                                            path="/settings/security"
                                            render={() => <SecurityContainer setActiveSection={setActiveSection} />}
                                        />
                                        <Redirect to="/settings" />
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

export default withRouter(PrivateLayout);
