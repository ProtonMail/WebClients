import { useEffect, useRef, useState } from 'react';
import { Route } from 'react-router';
import { useLocation, Redirect, Switch, useHistory } from 'react-router-dom';
import { localeCode } from '@proton/shared/lib/i18n';
import {
    Sidebar,
    useToggle,
    usePermissions,
    useUser,
    PrivateAppContainer,
    PrivateHeader,
    useActiveBreakpoint,
    SidebarList,
    SidebarNav,
    SidebarListItemsWithSubsections,
    MainLogo,
    ErrorBoundary,
    StandardErrorPage,
    LiveChatZendesk,
    ZendeskRef,
    AuthenticatedBugModal,
    useModals,
    useUserSettings,
} from '@proton/components';
import { hasPermission } from '@proton/shared/lib/helpers/permissions';
import { c } from 'ttag';
import { getPages } from './pages';
import DashboardContainer from './containers/DashboardContainer';
import GeneralContainer from './containers/GeneralContainer';
import AccountContainer from './containers/AccountContainer';
import DownloadsContainer from './containers/DownloadsContainer';
import PaymentsContainer from './containers/PaymentsContainer';
import VpnSidebarVersion from './containers/VpnSidebarVersion';
import TVContainer from './containers/TVContainer';

const MainContainer = () => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const history = useHistory();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const userPermissions = usePermissions();
    const { isNarrow } = useActiveBreakpoint();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState('');
    const filteredPages = getPages(user).filter(({ permissions: pagePermissions = [] }) =>
        hasPermission(userPermissions, pagePermissions)
    );
    const { createModal } = useModals();
    const zendeskRef = useRef<ZendeskRef>();
    const [showChat, setShowChat] = useState(false);
    const canEnableChat = user.hasPaidVpn;

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const hasChatRequest = searchParams.get('chat');

        searchParams.delete('chat');
        history.replace({
            search: searchParams.toString(),
        });
        if (hasChatRequest) {
            if (canEnableChat) {
                setShowChat(true);
            } else {
                createModal(<AuthenticatedBugModal mode="chat-unavailable" />);
            }
        }
    }, []);

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
            onOpenChat={
                canEnableChat
                    ? () => {
                          setShowChat(true);
                          zendeskRef.current?.show();
                      }
                    : undefined
            }
        />
    );

    const sidebar = (
        <Sidebar
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            version={<VpnSidebarVersion />}
            hasAppLinks={false}
        >
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
    const dashboardPage = filteredPages.some(({ to }) => {
        return to === '/dashboard';
    });
    return (
        <Switch>
            <Route path="/tv" exact component={TVContainer} />
            <Route path="*">
                <PrivateAppContainer header={header} sidebar={sidebar}>
                    <Switch>
                        {dashboardPage && (
                            <Route
                                path="/dashboard"
                                exact
                                render={({ location }) => (
                                    <DashboardContainer location={location} setActiveSection={setActiveSection} />
                                )}
                            />
                        )}
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
                        <Redirect to={dashboardPage ? '/dashboard' : '/downloads'} />
                    </Switch>
                    {showChat && canEnableChat ? (
                        <LiveChatZendesk
                            zendeskRef={zendeskRef}
                            zendeskKey="52184d31-aa98-430f-a86c-b5a93235027a"
                            name={user.DisplayName || user.Name}
                            email={user.Email || userSettings?.Email?.Value || ''}
                            onLoaded={() => zendeskRef.current?.show()}
                            locale={localeCode.replace('_', '-')}
                        />
                    ) : null}
                </PrivateAppContainer>
            </Route>
        </Switch>
    );
};

const WrappedMainContainer = () => {
    return (
        <ErrorBoundary component={<StandardErrorPage />}>
            <MainContainer />
        </ErrorBoundary>
    );
};

export default WrappedMainContainer;
