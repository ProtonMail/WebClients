import type { FunctionComponent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Route } from 'react-router';
import { Redirect, Switch, useHistory, useLocation } from 'react-router-dom';

import OrganizationSettingsRouter from 'proton-account/src/app/containers/organization/OrganizationSettingsRouter';
import { getOrganizationAppRoutes } from 'proton-account/src/app/containers/organization/routes';
import { c } from 'ttag';

import { useGroups } from '@proton/account/groups/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import AuthDevicesSettings from '@proton/account/sso/AuthDevicesSettings';
import MembersAuthDevicesTopBanner from '@proton/account/sso/MembersAuthDevicesTopBanner';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import type { SectionConfig } from '@proton/components';
import {
    AccountRecoverySection,
    AuthenticatedBugModal,
    AutomaticSubscriptionModal,
    type BugModalMode,
    CancelSubscriptionSection,
    CancelSubscriptionViaSupportSection,
    CancellationReminderSection,
    CredentialLeakSection,
    CreditsSection,
    DashboardTelemetry,
    DataRecoverySection,
    DeleteSection,
    DowngradeSubscriptionSection,
    EmailSubscriptionSection,
    FreeUserLiveChatModal,
    GiftCodeSection,
    InviteSection,
    InvoicesSection,
    LanguageSection,
    LogsSection,
    MainLogo,
    OpenVPNConfigurationSection,
    OpenVPNCredentialsSection,
    OverviewSection,
    PasswordsSection,
    PaymentMethodsSection,
    PlansSection,
    PrivacySection,
    PrivateAppContainer,
    PrivateHeader,
    PrivateMainAreaLoading,
    PrivateMainSettingsArea,
    ProtonVPNClientsSection,
    ReferralInvitesContextProvider,
    RewardSection,
    SentinelSection,
    SessionRecoverySection,
    SessionsSection,
    SettingsListItem,
    Sidebar,
    SidebarList,
    SidebarNav,
    SubscriptionModalProvider,
    SubscriptionsSection,
    TVContainer,
    ThemesSection,
    ThirdPartySection,
    TopBanners,
    TopNavbarGetStartedButton,
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
    useIsDataRecoveryAvailable,
    useIsSessionRecoveryAvailable,
    useModalState,
    useRecoveryNotification,
    useToggle,
} from '@proton/components';
import SSODomainUnverifiedBanner from '@proton/components/containers/account/sso/SSODomainUnverifiedBanner';
import { getIsSectionAvailable, getRoutePaths, getSectionPath } from '@proton/components/containers/layout/helper';
import { CANCEL_ROUTE } from '@proton/components/containers/payments/subscription/cancellationFlow/helper';
import LiveChatZendesk, { getIsSelfChat } from '@proton/components/containers/zendesk/LiveChatZendesk';
import type { ZendeskRef } from '@proton/components/containers/zendesk/helper';
import { useCanEnableChat } from '@proton/components/containers/zendesk/useCanEnableChat';
import { useIsGroupOwner } from '@proton/components/hooks/useIsGroupOwner';
import useShowVPNDashboard from '@proton/components/hooks/useShowVPNDashboard';
import { useIsB2BTrial } from '@proton/payments/ui';
import { APPS, VPN_TV_PATHS } from '@proton/shared/lib/constants';
import { localeCode } from '@proton/shared/lib/i18n';
import { locales } from '@proton/shared/lib/i18n/locales';
import { useFlag } from '@proton/unleash';

import VpnSidebarVersion from './containers/VpnSidebarVersion';
import { getRoutes } from './routes';

const MainContainer: FunctionComponent = () => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [userSettings] = useUserSettings();
    const history = useHistory();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { viewportWidth } = useActiveBreakpoint();
    const location = useLocation();
    const zendeskRef = useRef<ZendeskRef>();
    const [showChat, setShowChat] = useState({ autoLaunch: false, render: false });
    const isUserGroupsFeatureEnabled = useFlag('UserGroupsPermissionCheck');
    const canDisplayB2BLogsVPN = useFlag('B2BLogsVPN');
    const isB2BAuthLogsEnabled = useFlag('B2BAuthenticationLogs');
    const isZoomIntegrationEnabled = useFlag('ZoomIntegration');
    const isProtonMeetIntegrationEnabled = useFlag('NewScheduleOption');
    const isSharedServerFeatureEnabled = useFlag('SharedServerFeature');
    const isSsoForPbsEnabled = useFlag('SsoForPbs');
    const isRetentionPoliciesEnabled = useFlag('DataRetentionPolicy');
    const isUserGroupsNoCustomDomainEnabled = useFlag('UserGroupsNoCustomDomain');
    const [groups, loadingGroups] = useGroups();
    const { showVPNDashboard, showVPNDashboardVariant } = useShowVPNDashboard(APPS.PROTONVPN_SETTINGS);
    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const [referralInfo] = useReferralInfo();
    const [isDataRecoveryAvailable, loadingDataRecovery] = useIsDataRecoveryAvailable();
    const [isSessionRecoveryAvailable, loadingIsSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const recoveryNotification = useRecoveryNotification(false, false);
    const [isGroupOwner, loadingIsGroupOwner] = useIsGroupOwner();

    const vpnRoutes = getRoutes({
        user,
        subscription,
        showVPNDashboard,
        showVPNDashboardVariant: showVPNDashboardVariant.name,
        isB2BTrial,
        isReferralProgramEnabled: Boolean(userSettings.Referral?.Eligible),
        referralInfo: referralInfo.uiData,
        isProtonMeetIntegrationEnabled,
        isZoomIntegrationEnabled,
        organization,
        isDataRecoveryAvailable,
        isSessionRecoveryAvailable,
        recoveryNotificationColor: recoveryNotification?.color,
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
        isSsoForPbsEnabled,
        isRetentionPoliciesEnabled,
        isProtonMeetIntegrationEnabled,
        isUserGroupsNoCustomDomainEnabled,
        isGroupOwner,
    });

    const canEnableChat = useCanEnableChat(user);
    const chatTags = useMemo(() => {
        return organization?.PlanName ? [organization?.PlanName] : [];
    }, [organization?.PlanName]);
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
        const searchParams = new URLSearchParams(location.search);
        const hasChatRequest = !!searchParams.get('chat');
        const isSelfChat = getIsSelfChat();

        searchParams.delete('chat');
        history.replace({
            search: searchParams.toString(),
        });
        if (hasChatRequest || isSelfChat) {
            if (canEnableChat) {
                setShowChat({ autoLaunch: hasChatRequest, render: true });
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
              setShowChat({ autoLaunch: true, render: true });
              zendeskRef.current?.open();
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
            onBoardingButton={<TopNavbarGetStartedButton />}
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
                        (section: SectionConfig) =>
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

    const redirect = (() => {
        if (
            loadingSubscription ||
            loadingOrganization ||
            loadingGroups ||
            loadingDataRecovery ||
            loadingIsSessionRecoveryAvailable ||
            loadingIsGroupOwner
        ) {
            return <PrivateMainAreaLoading />;
        }

        /**
         * Dashboard -> Subscription redirects when dashboard v2 (and subscription) is active
         */
        if (getIsSectionAvailable(vpnRoutes.subscription)) {
            if (location.pathname === vpnRoutes.dashboard.to) {
                if (location.hash === '#invoices' || location.hash === '#your-subscriptions') {
                    return <Redirect to={`${vpnRoutes.subscription.to}${location.search}${location.hash}`} />;
                }
            }
        }

        return <Redirect to={getRedirectPath()} />;
    })();

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
                                    <DashboardTelemetry app={app} />
                                    <AutomaticSubscriptionModal />
                                    <PrivateMainSettingsArea
                                        config={vpnRoutes.dashboardV2}
                                        mainAreaClass="bg-lowered settings-cards"
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
                                        mainAreaClass="bg-lowered settings-cards"
                                        wrapperClass="w-full p-4 lg:p-6 xl:p-12 max-w-custom mx-auto"
                                        style={{ '--max-w-custom': '1500px' }}
                                    >
                                        <YourPlanSectionV2 app={app} editBillingCycle={true} />
                                        <SubscriptionsSection />
                                        <PaymentMethodsSection app={app} />
                                        <CreditsSection app={app} />
                                        <GiftCodeSection />
                                        <InvoicesSection app={app} />
                                        <CancelSubscriptionSection app={app} />
                                        <DowngradeSubscriptionSection app={app} />
                                        <CancelSubscriptionViaSupportSection />
                                    </PrivateMainSettingsArea>
                                </Route>
                            )}
                            {getIsSectionAvailable(vpnRoutes.dashboard) && (
                                <Route path={vpnRoutes.dashboard.to}>
                                    <DashboardTelemetry app={app} />
                                    <AutomaticSubscriptionModal />
                                    <PrivateMainSettingsArea config={vpnRoutes.dashboard}>
                                        <PlansSection app={app} />
                                        <YourPlanSection app={app} />
                                        <UpgradeVpnSection app={app} />
                                        <SubscriptionsSection />
                                        <PaymentMethodsSection app={app} />
                                        <CreditsSection app={app} />
                                        <GiftCodeSection />
                                        <InvoicesSection app={app} />
                                        <CancelSubscriptionSection app={app} />
                                        <DowngradeSubscriptionSection app={app} />
                                        <CancelSubscriptionViaSupportSection />
                                    </PrivateMainSettingsArea>
                                </Route>
                            )}
                            {getIsSectionAvailable(vpnRoutes.recovery) && (
                                <Route path={vpnRoutes.recovery.to}>
                                    <PrivateMainSettingsArea config={vpnRoutes.recovery}>
                                        <OverviewSection />
                                        <AccountRecoverySection />
                                        <DataRecoverySection />
                                        <SessionRecoverySection />
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
                                    <EmailSubscriptionSection />
                                    <DeleteSection />
                                </PrivateMainSettingsArea>
                            </Route>
                            <Route path={vpnRoutes.appearance.to}>
                                <PrivateMainSettingsArea config={vpnRoutes.appearance}>
                                    <ThemesSection />
                                </PrivateMainSettingsArea>
                            </Route>
                            <Route path={vpnRoutes.vpnSecurity.to}>
                                <AutomaticSubscriptionModal />
                                <PrivateMainSettingsArea config={vpnRoutes.vpnSecurity}>
                                    <SentinelSection app={app} />
                                    <CredentialLeakSection />
                                    <AuthDevicesSettings />
                                    <SessionsSection />
                                    <LogsSection />
                                    <ThirdPartySection />
                                    <PrivacySection />
                                </PrivateMainSettingsArea>
                            </Route>
                            <Route path={vpnRoutes.downloads.to}>
                                <PrivateMainSettingsArea config={vpnRoutes.downloads}>
                                    <ProtonVPNClientsSection />
                                    <WireGuardConfigurationSection />
                                    <OpenVPNConfigurationSection />
                                </PrivateMainSettingsArea>
                            </Route>
                            {getIsSectionAvailable(vpnRoutes.referral) && (
                                <Route path={vpnRoutes.referral.to}>
                                    <ReferralInvitesContextProvider>
                                        <PrivateMainSettingsArea config={vpnRoutes.referral}>
                                            <InviteSection />
                                            <RewardSection />
                                        </PrivateMainSettingsArea>
                                    </ReferralInvitesContextProvider>
                                </Route>
                            )}
                            <Route path={anyOrganizationAppRoute}>
                                <OrganizationSettingsRouter
                                    app={app}
                                    path=""
                                    organizationAppRoutes={organizationAppRoutes}
                                    redirect={redirect}
                                    onOpenChat={openChat}
                                    user={user}
                                    organization={organization}
                                    subscription={subscription}
                                />
                            </Route>
                            <Route path={`${CANCEL_ROUTE}`}>
                                <CancellationReminderSection app={APPS.PROTONVPN_SETTINGS} />
                            </Route>
                            {redirect}
                        </Switch>
                        {showChat.render && canEnableChat ? (
                            <LiveChatZendesk
                                tags={chatTags}
                                zendeskRef={zendeskRef}
                                name={name || ''}
                                email={email || ''}
                                onLoaded={() => {
                                    if (showChat.autoLaunch) {
                                        zendeskRef.current?.open();
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
