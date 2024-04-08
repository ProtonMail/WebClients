import { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Route } from 'react-router';
import { Redirect, Switch, useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    AccountRecoverySection,
    AuthenticatedBugModal,
    AutomaticSubscriptionModal,
    CancelB2bSubscriptionSection,
    CancelSubscriptionSection,
    CreditsSection,
    DeleteSection,
    DowngradeSubscriptionSection,
    EmailSubscriptionSection,
    FreeUserLiveChatModal,
    GatewaysSection,
    GiftCodeSection,
    InvoicesSection,
    LanguageSection,
    MainLogo,
    OpenVPNConfigurationSection,
    OpenVPNCredentialsSection,
    OrganizationSection,
    PasswordsSection,
    PaymentMethodsSection,
    PlansSection,
    PrivateAppContainer,
    PrivateHeader,
    PrivateMainAreaLoading,
    PrivateMainSettingsArea,
    ProtonVPNClientsSection,
    SettingsListItem,
    Sidebar,
    SidebarList,
    SidebarNav,
    SubscriptionModalProvider,
    SubscriptionsSection,
    ThemesSection,
    TopBanners,
    TopNavbarUpsell,
    UnAuthenticated,
    UpgradeVpnSection,
    UserDropdown,
    UsernameSection,
    UsersAndAddressesSection,
    WireGuardConfigurationSection,
    YourPlanSection,
    useActiveBreakpoint,
    useModalState,
    useOrganization,
    useSubscription,
    useToggle,
    useUser,
    useUserSettings,
} from '@proton/components';
import {
    OrganizationScheduleCallSection,
    OrganizationTwoFAEnforcementSection,
    OrganizationTwoFAHeader,
    OrganizationTwoFARemindersSection,
    SsoPage,
    useFlag,
} from '@proton/components/containers';
import TwoFactorSection from '@proton/components/containers/account/TwoFactorSection';
import { PrivateMainSettingsAreaBase } from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import { BugModalMode } from '@proton/components/containers/support/BugModal';
import LiveChatZendesk, {
    ZendeskRef,
    getIsSelfChat,
    useCanEnableChat,
} from '@proton/components/containers/zendesk/LiveChatZendesk';
import { APPS } from '@proton/shared/lib/constants';
import { localeCode } from '@proton/shared/lib/i18n';
import { locales } from '@proton/shared/lib/i18n/locales';

import TVContainer from './containers/TVContainer';
import VpnSidebarVersion from './containers/VpnSidebarVersion';
import { getRoutes } from './routes';

const vpnZendeskKey = 'c08ab87d-68c3-4d7d-a419-a0a1ef34759d';

const MainContainer: FunctionComponent = () => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [tagsArray, setTagsArray] = useState<string[]>([]);
    const [userSettings] = useUserSettings();
    const history = useHistory();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { viewportWidth } = useActiveBreakpoint();
    const location = useLocation();
    const zendeskRef = useRef<ZendeskRef>();
    const [showChat, setShowChat] = useState({ autoToggle: false, render: false });
    const isScheduleCallsEnabled = useFlag('ScheduleB2BSupportPhoneCalls');
    const routes = getRoutes({ user, subscription, organization, isScheduleCallsEnabled });
    const canEnableChat = useCanEnableChat(user);
    const [authenticatedBugReportMode, setAuthenticatedBugReportMode] = useState<BugModalMode>();
    const [authenticatedBugReportModal, setAuthenticatedBugReportModal, render] = useModalState();
    const [freeUserLiveChatModal, setFreeUserLiveChatModal, renderFreeUserLiveChatModal] = useModalState();
    const [{ ignoreOnboarding }] = useState(() => {
        return {
            ignoreOnboarding: location.pathname !== '/downloads',
        };
    });
    const app = APPS.PROTONVPN_SETTINGS;
    const onceRef = useRef<boolean>(false);

    const openAuthenticatedBugReportModal = (mode: BugModalMode) => {
        setAuthenticatedBugReportMode(mode);
        setAuthenticatedBugReportModal(true);
    };

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
                setFreeUserLiveChatModal(true);
            }
        }
    }, []);

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    const logo = <MainLogo to="/" />;

    const top = <TopBanners app={APPS.PROTONVPN_SETTINGS} />;

    const openChat = canEnableChat
        ? () => {
              setShowChat({ autoToggle: true, render: true });
              zendeskRef.current?.toggle();
          }
        : undefined;

    const header = (
        <PrivateHeader
            app={app}
            userDropdown={<UserDropdown app={app} onOpenChat={openChat} />}
            upsellButton={<TopNavbarUpsell offerProps={{ ignoreOnboarding }} app={app} />}
            title={c('Title').t`Settings`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isSmallViewport={viewportWidth['<=small']}
        />
    );

    const sidebar = (
        <Sidebar
            app={APPS.PROTONVPN_SETTINGS}
            appsDropdown={null}
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            version={<VpnSidebarVersion />}
            hasAppLinks={false}
        >
            <SidebarNav>
                <SidebarList>
                    {Object.values(routes).map(
                        (section) =>
                            getIsSectionAvailable(section) && (
                                <SettingsListItem
                                    to={getSectionPath('', section)}
                                    icon={section.icon}
                                    notification={section.notification}
                                    key={section.to}
                                >
                                    <span className="text-ellipsis" title={section.text}>
                                        {section.text}
                                    </span>
                                </SettingsListItem>
                            )
                    )}
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );
    const name = user.DisplayName || user.Name;
    const email = user.Email || userSettings?.Email?.Value;
    return (
        <>
            {render && <AuthenticatedBugModal mode={authenticatedBugReportMode} {...authenticatedBugReportModal} />}
            {renderFreeUserLiveChatModal && <FreeUserLiveChatModal {...freeUserLiveChatModal} />}
            <Switch>
                <Route path="/tv">
                    <UnAuthenticated>
                        <TVContainer />
                    </UnAuthenticated>
                </Route>
                <Route path="*">
                    <PrivateAppContainer top={top} header={header} sidebar={sidebar}>
                        <Switch>
                            {getIsSectionAvailable(routes.dashboard) && (
                                <Route path={routes.dashboard.to}>
                                    <SubscriptionModalProvider app={app}>
                                        <AutomaticSubscriptionModal />
                                        <PrivateMainSettingsArea config={routes.dashboard}>
                                            <PlansSection app={app} />
                                            <YourPlanSection app={app} />
                                            <UpgradeVpnSection app={app} />
                                            <SubscriptionsSection />
                                            <PaymentMethodsSection />
                                            <CreditsSection />
                                            <GiftCodeSection />
                                            <InvoicesSection />
                                            <CancelSubscriptionSection app={app} />
                                            <DowngradeSubscriptionSection app={app} />
                                            <CancelB2bSubscriptionSection />
                                        </PrivateMainSettingsArea>
                                    </SubscriptionModalProvider>
                                </Route>
                            )}
                            <Route path={routes.account.to}>
                                <PrivateMainSettingsArea config={routes.account}>
                                    <>
                                        <UsernameSection app={app} />
                                        <PasswordsSection />
                                    </>
                                    <LanguageSection locales={locales} />
                                    <TwoFactorSection />
                                    <OpenVPNCredentialsSection />
                                    <AccountRecoverySection />
                                    <EmailSubscriptionSection />
                                    <DeleteSection />
                                </PrivateMainSettingsArea>
                            </Route>
                            <Route path={routes.appearance.to}>
                                <PrivateMainSettingsArea config={routes.appearance}>
                                    <ThemesSection />
                                </PrivateMainSettingsArea>
                            </Route>
                            <Route path={routes.downloads.to}>
                                <PrivateMainSettingsArea config={routes.downloads}>
                                    <ProtonVPNClientsSection />
                                    <OpenVPNConfigurationSection />
                                    <WireGuardConfigurationSection />
                                </PrivateMainSettingsArea>
                            </Route>
                            {getIsSectionAvailable(routes.setup) ? (
                                <Route path={routes.setup.to}>
                                    <PrivateMainSettingsArea config={routes.setup}>
                                        <OrganizationScheduleCallSection onOpenChat={openChat} />
                                        <OrganizationSection organization={organization} app={app} />
                                    </PrivateMainSettingsArea>
                                </Route>
                            ) : (
                                getIsSectionAvailable(routes.users) && (
                                    /* After the org is setup, and the setup route becomes unavailable, we redirect to the users route */
                                    <Route path={routes.setup.to}>
                                        <Redirect to={routes.users.to} />
                                    </Route>
                                )
                            )}
                            {getIsSectionAvailable(routes.users) && (
                                <Route path={routes.users.to}>
                                    <SubscriptionModalProvider app={app}>
                                        <PrivateMainSettingsArea config={routes.users}>
                                            <OrganizationScheduleCallSection onOpenChat={openChat} />
                                            <UsersAndAddressesSection app={app} onceRef={onceRef} />
                                        </PrivateMainSettingsArea>
                                    </SubscriptionModalProvider>
                                </Route>
                            )}
                            {getIsSectionAvailable(routes.gateways) && (
                                <Route path={routes.gateways.to}>
                                    <PrivateMainSettingsArea config={routes.gateways}>
                                        <SubscriptionModalProvider app={app}>
                                            <GatewaysSection organization={organization} />
                                        </SubscriptionModalProvider>
                                    </PrivateMainSettingsArea>
                                </Route>
                            )}
                            {getIsSectionAvailable(routes.security) && (
                                <Route path={routes.security.to}>
                                    <PrivateMainSettingsArea config={routes.security}>
                                        <OrganizationTwoFAHeader organization={organization} />
                                        <OrganizationTwoFARemindersSection organization={organization} />
                                        <OrganizationTwoFAEnforcementSection organization={organization} />
                                    </PrivateMainSettingsArea>
                                </Route>
                            )}
                            {getIsSectionAvailable(routes.sso) && (
                                <Route path={routes.sso.to}>
                                    <PrivateMainSettingsAreaBase
                                        title={routes.sso.title || routes.sso.text}
                                        description={routes.sso.description}
                                    >
                                        <SubscriptionModalProvider app={app}>
                                            <SsoPage />
                                        </SubscriptionModalProvider>
                                    </PrivateMainSettingsAreaBase>
                                </Route>
                            )}
                            {loadingSubscription || loadingOrganization ? (
                                <PrivateMainAreaLoading />
                            ) : (
                                <Redirect
                                    to={
                                        getIsSectionAvailable(routes.dashboard)
                                            ? routes.dashboard.to
                                            : routes.downloads.to
                                    }
                                />
                            )}
                        </Switch>
                        {showChat.render && canEnableChat ? (
                            <LiveChatZendesk
                                tags={tagsArray}
                                zendeskRef={zendeskRef}
                                zendeskKey={vpnZendeskKey}
                                name={name || ''}
                                email={email || ''}
                                onLoaded={() => {
                                    if (showChat.autoToggle) {
                                        zendeskRef.current?.toggle();
                                    }
                                }}
                                onUnavailable={() => {
                                    openAuthenticatedBugReportModal('chat-no-agents');
                                }}
                                locale={localeCode.replace('_', '-')}
                            />
                        ) : null}
                    </PrivateAppContainer>
                </Route>
            </Switch>
        </>
    );
};

export default MainContainer;
