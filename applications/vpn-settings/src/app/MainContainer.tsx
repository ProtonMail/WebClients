import type { FunctionComponent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Route } from 'react-router';
import { Redirect, Switch, useHistory, useLocation } from 'react-router-dom';

import OrganizationSettingsRouter from 'proton-account/src/app/containers/organization/OrganizationSettingsRouter';
import { getOrganizationAppRoutes } from 'proton-account/src/app/containers/organization/routes';
import { c } from 'ttag';

import { useGroups } from '@proton/account/groups/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import MembersAuthDevicesTopBanner from '@proton/account/sso/MembersAuthDevicesTopBanner';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import {
    AccountRecoverySection,
    AuthenticatedBugModal,
    AutomaticSubscriptionModal,
    type BugModalMode,
    CancelSubscriptionSection,
    CancelSubscriptionViaSupportSection,
    CancellationReminderSection,
    CreditsSection,
    DeleteSection,
    DowngradeSubscriptionSection,
    EmailSubscriptionSection,
    FreeUserLiveChatModal,
    GiftCodeSection,
    InvoicesSection,
    LanguageSection,
    MainLogo,
    OpenVPNConfigurationSection,
    OpenVPNCredentialsSection,
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
    TVContainer,
    ThemesSection,
    TopBanners,
    TopNavbarUpsell,
    TwoFactorSection,
    UnAuthenticated,
    UpgradeVpnSection,
    UserDropdown,
    UsernameSection,
    VpnAlsoInYourPlanSection,
    VpnBlogSection,
    VpnDownloadAndInfoSection,
    WireGuardConfigurationSection,
    YourPlanSection,
    YourPlanSectionV2,
    YourPlanUpsellsSectionV2,
    useActiveBreakpoint,
    useModalState,
    useToggle,
} from '@proton/components';
import SSODomainUnverifiedBanner from '@proton/components/containers/account/sso/SSODomainUnverifiedBanner';
import { getIsSectionAvailable, getRoutePaths, getSectionPath } from '@proton/components/containers/layout/helper';
import { CANCEL_ROUTE } from '@proton/components/containers/payments/subscription/cancellationFlow/helper';
import type { ZendeskRef } from '@proton/components/containers/zendesk/LiveChatZendesk';
import LiveChatZendesk, {
    getIsSelfChat,
    useCanEnableChat,
} from '@proton/components/containers/zendesk/LiveChatZendesk';
import useShowVPNDashboard from '@proton/components/hooks/useShowVPNDashboard';
import { APPS, VPN_TV_PATHS } from '@proton/shared/lib/constants';
import { localeCode } from '@proton/shared/lib/i18n';
import { locales } from '@proton/shared/lib/i18n/locales';
import { useFlag } from '@proton/unleash';

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
    const isAccessControlEnabled = useFlag('AccessControl');
    const isUserGroupsFeatureEnabled = useFlag('UserGroupsPermissionCheck');
    const canDisplayB2BLogsVPN = useFlag('B2BLogsVPN');
    const isB2BAuthLogsEnabled = useFlag('B2BAuthenticationLogs');
    const isZoomIntegrationEnabled = useFlag('ZoomIntegration');
    const isSharedServerFeatureEnabled = useFlag('SharedServerFeature');
    const [groups, loadingGroups] = useGroups();
    const { showVPNDashboard } = useShowVPNDashboard(APPS.PROTONVPN_SETTINGS);

    const vpnRoutes = getRoutes({
        user,
        subscription,
        showVPNDashboard,
    });

    const organizationAppRoutes = getOrganizationAppRoutes({
        app: APPS.PROTONVPN_SETTINGS,
        organization,
        user,
        subscription,
        isUserGroupsFeatureEnabled,
        canDisplayB2BLogsVPN,
        isB2BAuthLogsEnabled,
        groups,
        isZoomIntegrationEnabled,
        isSharedServerFeatureEnabled,
        isAccessControlEnabled,
    });

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

    const top = (
        <TopBanners app={APPS.PROTONVPN_SETTINGS}>
            <SSODomainUnverifiedBanner app={APPS.PROTONVPN_SETTINGS} />
            <MembersAuthDevicesTopBanner />
        </TopBanners>
    );

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
                    {Object.values({
                        ...vpnRoutes,
                        ...(organizationAppRoutes.available ? organizationAppRoutes.routes : {}),
                    }).map(
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

    const getRedirectPath = () => {
        if (getIsSectionAvailable(vpnRoutes.dashboardV2)) {
            return `${vpnRoutes.dashboardV2.to}${location.search}${location.hash}`;
        }
        if (getIsSectionAvailable(vpnRoutes.dashboard)) {
            return `${vpnRoutes.dashboard.to}${location.search}${location.hash}`;
        }
        return vpnRoutes.downloads.to;
    };

    const redirect =
        loadingSubscription || loadingOrganization || loadingGroups ? (
            <PrivateMainAreaLoading />
        ) : (
            <Redirect to={getRedirectPath()} />
        );

    const anyOrganizationAppRoute = getRoutePaths('', Object.values(organizationAppRoutes.routes));

    return (
        <SubscriptionModalProvider app={app}>
            {render && <AuthenticatedBugModal mode={authenticatedBugReportMode} {...authenticatedBugReportModal} />}
            {renderFreeUserLiveChatModal && <FreeUserLiveChatModal {...freeUserLiveChatModal} />}
            <Switch>
                <Route path={VPN_TV_PATHS}>
                    <UnAuthenticated>
                        <TVContainer />
                    </UnAuthenticated>
                </Route>
                <Route path="*">
                    <PrivateAppContainer top={top} header={header} sidebar={sidebar}>
                        <Switch>
                            {getIsSectionAvailable(vpnRoutes.dashboardV2) && (
                                <Route path={vpnRoutes.dashboardV2.to}>
                                    <AutomaticSubscriptionModal />
                                    <PrivateMainSettingsArea
                                        config={vpnRoutes.dashboardV2}
                                        mainAreaClass="bg-lowered"
                                        wrapperClass="w-full p-4 lg:p-6 xl:p-12 max-w-custom mx-auto"
                                        style={{ '--max-w-custom': '1500px' }}
                                    >
                                        <YourPlanSectionV2 app={app} />
                                        <YourPlanUpsellsSectionV2 app={app} />
                                        <VpnDownloadAndInfoSection app={app} />
                                        <VpnAlsoInYourPlanSection app={app} />
                                        <VpnBlogSection />
                                    </PrivateMainSettingsArea>
                                </Route>
                            )}
                            {getIsSectionAvailable(vpnRoutes.subscription) && (
                                <Route path={vpnRoutes.subscription.to}>
                                    <AutomaticSubscriptionModal />
                                    <PrivateMainSettingsArea
                                        config={vpnRoutes.subscription}
                                        mainAreaClass="bg-lowered"
                                        wrapperClass="w-full p-4 lg:p-6 xl:p-12 max-w-custom mx-auto"
                                        style={{ '--max-w-custom': '1500px' }}
                                    >
                                        <YourPlanSectionV2 app={app} editBillingCycle={true} />
                                        <SubscriptionsSection />
                                        <PaymentMethodsSection />
                                        <CreditsSection />
                                        <GiftCodeSection />
                                        <InvoicesSection />
                                        <CancelSubscriptionSection app={app} />
                                        <DowngradeSubscriptionSection app={app} />
                                        <CancelSubscriptionViaSupportSection />
                                    </PrivateMainSettingsArea>
                                </Route>
                            )}

                            {getIsSectionAvailable(vpnRoutes.dashboard) && (
                                <Route path={vpnRoutes.dashboard.to}>
                                    <AutomaticSubscriptionModal />
                                    <PrivateMainSettingsArea config={vpnRoutes.dashboard}>
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
                                        <CancelSubscriptionViaSupportSection />
                                    </PrivateMainSettingsArea>
                                </Route>
                            )}
                            <Route path="/account">
                                <Redirect to={vpnRoutes.account.to} />
                            </Route>
                            <Route path={vpnRoutes.account.to}>
                                <PrivateMainSettingsArea config={vpnRoutes.account}>
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
                            <Route path={vpnRoutes.appearance.to}>
                                <PrivateMainSettingsArea config={vpnRoutes.appearance}>
                                    <ThemesSection />
                                </PrivateMainSettingsArea>
                            </Route>
                            <Route path={vpnRoutes.downloads.to}>
                                <PrivateMainSettingsArea config={vpnRoutes.downloads}>
                                    <ProtonVPNClientsSection />
                                    <OpenVPNConfigurationSection />
                                    <WireGuardConfigurationSection />
                                </PrivateMainSettingsArea>
                            </Route>
                            <Route path={anyOrganizationAppRoute}>
                                <OrganizationSettingsRouter
                                    app={app}
                                    path=""
                                    organizationAppRoutes={organizationAppRoutes}
                                    redirect={redirect}
                                    onOpenChat={openChat}
                                />
                            </Route>
                            <Route path={`${CANCEL_ROUTE}`}>
                                <CancellationReminderSection app={APPS.PROTONVPN_SETTINGS} />
                            </Route>
                            {redirect}
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
        </SubscriptionModalProvider>
    );
};

export default MainContainer;
