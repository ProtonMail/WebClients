import { useEffect, useRef, useState } from 'react';
import { Route } from 'react-router';
import { useLocation, Redirect, Switch, useHistory } from 'react-router-dom';
import { localeCode } from '@proton/shared/lib/i18n';
import {
    Sidebar,
    useToggle,
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
    AuthenticatedBugModal,
    useModals,
    useUserSettings,
    useSubscription,
    PlansSection,
    YourPlanSection,
    BillingSection,
    CreditsSection,
    GiftCodeSection,
    CancelSubscriptionSection,
    PrivateMainSettingsArea,
    LanguageSection,
    PaymentMethodsSection,
    InvoicesSection,
    ProtonVPNClientsSection,
    OpenVPNConfigurationSection,
    UsernameSection,
    PasswordsSection,
    OpenVPNCredentialsSection,
    AccountRecoverySection,
    EmailSubscriptionSection,
    DeleteSection,
} from '@proton/components';
import LiveChatZendesk, {
    ZendeskRef,
    getIsSelfChat,
    useCanEnableChat,
} from '@proton/components/containers/zendesk/LiveChatZendesk';
import { c } from 'ttag';
import { getIsSectionAvailable } from '@proton/components/containers/layout/helper';
import { locales } from '@proton/shared/lib/i18n/locales';
import { getRoutes } from './routes';
import VpnSidebarVersion from './containers/VpnSidebarVersion';
import TVContainer from './containers/TVContainer';
import DashboardAutomaticModal from './containers/DashboardAutomaticModal';

const MainContainer = () => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [tagsArray, setTagsArray] = useState<string[]>([]);
    const [userSettings] = useUserSettings();
    const history = useHistory();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { isNarrow } = useActiveBreakpoint();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState('');
    const { createModal } = useModals();
    const zendeskRef = useRef<ZendeskRef>();
    const [showChat, setShowChat] = useState({ autoToggle: false, render: false });
    const routes = getRoutes(user);
    const canEnableChat = useCanEnableChat(user);
    const [action] = useState(() => {
        return new URLSearchParams(location.search).get('action');
    });
    const onceRef = useRef(false);

    useEffect(() => {
        if (loadingSubscription || !canEnableChat) {
            return;
        }
        const subscriptionUserPaid: string[] = subscription?.Plans?.map((plan) => plan.Name) || [];
        setTagsArray(subscriptionUserPaid);
    }, [subscription]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const hasChatRequest = !!searchParams.get('chat');
        const isSelfChat = getIsSelfChat();

        searchParams.delete('chat');
        history.replace({
            search: searchParams.toString(),
        });
        if (hasChatRequest || isSelfChat) {
            if (canEnableChat) {
                setShowChat({ autoToggle: hasChatRequest, render: true });
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
            appsDropdown={null}
            onOpenChat={
                canEnableChat
                    ? () => {
                          setShowChat({ autoToggle: true, render: true });
                          zendeskRef.current?.toggle();
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
                        list={Object.values(routes)}
                        pathname={location.pathname}
                        activeSection={activeSection}
                    />
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );
    return (
        <Switch>
            <Route path="/tv">
                <TVContainer />
            </Route>
            <Route path="*">
                <PrivateAppContainer header={header} sidebar={sidebar}>
                    <Switch>
                        {getIsSectionAvailable(routes.dashboard) && (
                            <Route path={routes.dashboard.to}>
                                <DashboardAutomaticModal onceRef={onceRef} />
                                <PrivateMainSettingsArea
                                    setActiveSection={setActiveSection}
                                    location={location}
                                    config={routes.dashboard}
                                >
                                    <PlansSection />
                                    <YourPlanSection />
                                    <BillingSection />
                                    <CreditsSection />
                                    <GiftCodeSection />
                                    <CancelSubscriptionSection />
                                </PrivateMainSettingsArea>
                            </Route>
                        )}
                        <Route path={routes.general.to}>
                            <PrivateMainSettingsArea
                                setActiveSection={setActiveSection}
                                location={location}
                                config={routes.general}
                            >
                                <LanguageSection locales={locales} />
                            </PrivateMainSettingsArea>
                        </Route>
                        <Route path={routes.account.to}>
                            <PrivateMainSettingsArea
                                setActiveSection={setActiveSection}
                                location={location}
                                config={routes.account}
                            >
                                <UsernameSection />
                                <PasswordsSection open={action === 'change-password'} />
                                <OpenVPNCredentialsSection />
                                <AccountRecoverySection />
                                <EmailSubscriptionSection />
                                <DeleteSection />
                            </PrivateMainSettingsArea>
                        </Route>
                        <Route path={routes.downloads.to}>
                            <PrivateMainSettingsArea
                                setActiveSection={setActiveSection}
                                location={location}
                                config={routes.downloads}
                            >
                                <ProtonVPNClientsSection />
                                <OpenVPNConfigurationSection />
                            </PrivateMainSettingsArea>
                        </Route>
                        {getIsSectionAvailable(routes.payments) && (
                            <Route path={routes.payments.to}>
                                <PrivateMainSettingsArea
                                    setActiveSection={setActiveSection}
                                    location={location}
                                    config={routes.payments}
                                >
                                    <PaymentMethodsSection />
                                    <InvoicesSection />
                                </PrivateMainSettingsArea>
                            </Route>
                        )}
                        <Redirect
                            to={getIsSectionAvailable(routes.dashboard) ? routes.dashboard.to : routes.downloads.to}
                        />
                    </Switch>
                    {showChat.render && canEnableChat ? (
                        <LiveChatZendesk
                            tags={tagsArray}
                            zendeskRef={zendeskRef}
                            zendeskKey="52184d31-aa98-430f-a86c-b5a93235027a"
                            name={user.DisplayName || user.Name}
                            email={user.Email || userSettings?.Email?.Value || ''}
                            onLoaded={() => {
                                if (showChat.autoToggle) {
                                    zendeskRef.current?.toggle();
                                }
                            }}
                            onUnavailable={() => {
                                createModal(<AuthenticatedBugModal mode="chat-no-agents" />);
                            }}
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
