import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';
import { Route } from 'react-router';
import { Redirect, Switch, useLocation } from 'react-router-dom';

import RecoverySettingsRouter from 'proton-account/src/app/containers/account/recovery/RecoverySettingsRouter';
import OrganizationSettingsRouter from 'proton-account/src/app/containers/organization/OrganizationSettingsRouter';
import { getOrganizationAppRoutes } from 'proton-account/src/app/containers/organization/routes';
import { AutocompleteSettingsSearch } from 'proton-account/src/app/content/SettingsSearch';
import type {
    AccountRecoveryRouterFlags,
    Flags,
    OrganizationSettingsRouterParams,
} from 'proton-account/src/app/content/router-params';
import { c } from 'ttag';

import { useGroups } from '@proton/account/groups/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useIsDataRecoveryAvailable } from '@proton/account/recovery/dataRecovery';
import { useIsSessionRecoveryAvailable } from '@proton/account/recovery/sessionRecoveryHooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import AuthDevicesSettings from '@proton/account/sso/AuthDevicesSettings';
import MembersAuthDevicesTopBanner from '@proton/account/sso/MembersAuthDevicesTopBanner';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { EMPTY_ORG_PERMISSIONS } from '@proton/account/userPermissions';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { ThirdPartySection } from '@proton/calendar-video-conferencing/thirdParty/ThirdPartySection';
import TopNavbarUpsell from '@proton/components/components/topnavbar/TopNavbarUpsell';
import DeleteSection from '@proton/components/containers/account/DeleteSection';
import EmailSubscriptionSection from '@proton/components/containers/account/EmailSubscriptionSection';
import PasswordsSection from '@proton/components/containers/account/PasswordsSection';
import TwoFactorSection from '@proton/components/containers/account/TwoFactorSection';
import UsernameSection from '@proton/components/containers/account/UsernameSection';
import SSODomainUnverifiedBanner from '@proton/components/containers/account/sso/SSODomainUnverifiedBanner';
import PrivateAppContainer from '@proton/components/containers/app/PrivateAppContainer';
import UnAuthenticated from '@proton/components/containers/authentication/UnAuthenticated';
import CredentialLeakSection from '@proton/components/containers/credentialLeak/CredentialLeakSection';
import LanguageSection from '@proton/components/containers/general/LanguageSection';
import PrivateHeader from '@proton/components/containers/heading/PrivateHeader';
import UserDropdown from '@proton/components/containers/heading/UserDropdown';
import InvoicesSection from '@proton/components/containers/invoices/InvoicesSection';
import PrivateMainAreaLoading from '@proton/components/containers/layout/PrivateMainAreaLoading';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { getIsSectionAvailable, getRoutePaths } from '@proton/components/containers/layout/helper';
import { SettingsCardMaxWidth } from '@proton/components/containers/layout/interface';
import LogsSection from '@proton/components/containers/logs/LogsSection';
import CreditsSection from '@proton/components/containers/payments/CreditsSection';
import GiftCodeSection from '@proton/components/containers/payments/GiftCodeSection';
import PlansSection from '@proton/components/containers/payments/PlansSection';
import SubscriptionsSection from '@proton/components/containers/payments/SubscriptionsSection';
import PaymentMethodsSection from '@proton/components/containers/payments/methods/PaymentMethodsSection';
import AutomaticSubscriptionModal from '@proton/components/containers/payments/subscription/AutomaticSubscriptionModal';
import DashboardTelemetry from '@proton/components/containers/payments/subscription/DashboardTelemetry';
import DowngradeSubscriptionSection from '@proton/components/containers/payments/subscription/DowngradeSubscriptionSection';
import SubscriptionModalProvider, {
    UpsellModalTelemetryProvider,
} from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import UpgradeVpnSection from '@proton/components/containers/payments/subscription/UpgradeVpnSection';
import YourPlanSection from '@proton/components/containers/payments/subscription/YourPlanSection';
import DashboardComparePlansCTA from '@proton/components/containers/payments/subscription/YourPlanSectionV2/DashboardComparePlansCTA';
import YourPlanSectionV2 from '@proton/components/containers/payments/subscription/YourPlanSectionV2/YourPlanSectionV2';
import { YourPlanUpsellsSectionV2 } from '@proton/components/containers/payments/subscription/YourPlanSectionV2/YourPlanUpsellsSectionV2';
import { CancelSubscriptionSection } from '@proton/components/containers/payments/subscription/cancelSubscription';
import CancelSubscriptionViaSupportSection from '@proton/components/containers/payments/subscription/cancelSubscriptionViaSupport/CancelSubscriptionViaSupportSection';
import { CancellationReminderSection } from '@proton/components/containers/payments/subscription/cancellationFlow/CancellationReminderSection';
import { CANCEL_ROUTE } from '@proton/components/containers/payments/subscription/cancellationFlow/helper';
import PrivacySection from '@proton/components/containers/privacy/PrivacySection';
import { ReferralInvitesContextProvider } from '@proton/components/containers/referral/ReferralInvitesContext';
import ReferralPageTelemetry from '@proton/components/containers/referral/components/ReferralPageTelemetry';
import { useReferralUserEligible } from '@proton/components/containers/referral/hooks/useReferralUserEligible';
import { InviteSection } from '@proton/components/containers/referral/invite/InviteSection';
import { RewardSection } from '@proton/components/containers/referral/rewards/RewardSection';
import { SentinelSection } from '@proton/components/containers/sentinel/SentinelSection';
import SessionsSection from '@proton/components/containers/sessions/SessionsSection';
import ThemesSection from '@proton/components/containers/themes/ThemesSection';
import TopBanners from '@proton/components/containers/topBanners/TopBanners';
import OpenVPNCredentialsSection from '@proton/components/containers/vpn/OpenVPNCredentialsSection';
import { VpnAlsoInYourPlanSection } from '@proton/components/containers/vpn/VpnAlsoInYourPlanSection/VpnAlsoInYourPlanSection';
import { VpnBlogSection } from '@proton/components/containers/vpn/VpnBlogSection/VpnBlogSection';
import LiveChatZendesk from '@proton/components/containers/zendesk/LiveChatZendesk';
import { getZendeskTags } from '@proton/components/containers/zendesk/helper';
import { useZendeskChat } from '@proton/components/containers/zendesk/useZendeskChat';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useIsGroupOwner } from '@proton/components/hooks/useIsGroupOwner';
import useRecoveryNotification from '@proton/components/hooks/useRecoveryNotification';
import useShowVPNDashboard from '@proton/components/hooks/useShowVPNDashboard';
import useToggle from '@proton/components/hooks/useToggle';
import { useEntitlementChecks } from '@proton/payments/core/entitlements/hooks';
import { APPS, VPN_TV_PATHS } from '@proton/shared/lib/constants';
import { getIsAccountRecoveryAvailable } from '@proton/shared/lib/helpers/recovery';
import { localeCode } from '@proton/shared/lib/i18n';
import { locales } from '@proton/shared/lib/i18n/locales';
import { useFlag } from '@proton/unleash/useFlag';
import { GetStartedOnboarding } from '@proton/vpn/components/Onboarding';
import { VPNDownloadAndInfoSection } from '@proton/vpn/components/VPNDownloadSection';
import { TVContainer } from '@proton/vpn/components/tv';
import { NavigationProvider, useB2BAdminNavigation } from '@proton/vpn/contexts/navigation';

import { DownloadsRoute } from '../routes/downloads';
import { VPNSidebar } from './VPNSidebar';
import { getRoutes } from './routes';

const SettingsSearchArea = () => {
    const { viewportWidth } = useActiveBreakpoint();
    const adminSidebarFeature = useB2BAdminNavigation();

    if (!(adminSidebarFeature.enabled && viewportWidth['>=large'])) {
        return null;
    }

    return <AutocompleteSettingsSearch options={adminSidebarFeature.settings} />;
};

const MainContainer: FunctionComponent = () => {
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [{ permissions }] = useUserPermissions();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { viewportWidth } = useActiveBreakpoint();
    const location = useLocation();
    const isUserGroupsFeatureEnabled = useFlag('UserGroupsPermissionCheck');
    const isZoomIntegrationDisabled = useFlag('ZoomIntegrationDisabled');
    const isZoomIntegrationEnabled = !isZoomIntegrationDisabled;
    const isProtonMeetIntegrationEnabled = useFlag('NewScheduleOption');
    const isSharedServerFeatureEnabled = useFlag('SharedServerFeature');
    const isSsoForPbsEnabled = useFlag('SsoForPbs');
    const isRetentionPoliciesEnabled = useFlag('DataRetentionPolicy');
    const isUserGroupsNoCustomDomainEnabled = useFlag('UserGroupsNoCustomDomain');
    const isUserGroupsPassBusinessEnabled = useFlag('UserGroupsPassBusiness');
    const isAlwaysOnVpnEnabled = useFlag('B2BAlwaysOnEnabled');

    const [groups, loadingGroups] = useGroups();
    const { showVPNDashboard, showVPNDashboardVariant } = useShowVPNDashboard(APPS.PROTONVPN_SETTINGS);
    const [referralInfo] = useReferralInfo();
    const [{ isMnemonicAvailable, isRecoveryFileAvailable, isDataRecoveryAvailable }, loadingDataRecovery] =
        useIsDataRecoveryAvailable();
    const [isSessionRecoveryAvailable, loadingIsSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const recoveryNotification = useRecoveryNotification(false, false);
    const [isGroupOwner, loadingIsGroupOwner] = useIsGroupOwner();
    const [entitlements] = useEntitlementChecks();

    const { isUserEligible: isReferralProgramEnabled } = useReferralUserEligible();

    // Zendesk Chat Integration
    const { handleOpenZendeskChat, showZendeskChat, zendeskRef } = useZendeskChat(user);

    const organizationSettingsRouterParams: OrganizationSettingsRouterParams = {
        groups,
        organization,
        isB2BDrive: false,
        isGroupOwner,
        permissions: permissions ?? EMPTY_ORG_PERMISSIONS,
        memberships: [],
    };

    const accountRecoveryRouterFlags: AccountRecoveryRouterFlags = {
        isAccountRecoveryAvailable: getIsAccountRecoveryAvailable(user),
        isMnemonicAvailable,
        isRecoveryFileAvailable,
        isDataRecoveryAvailable,
        isSessionRecoveryAvailable,
        // Delegated access disabled on VPN because 1) it doesn't support the account switcher, and 2) it doesn't get pass scope.
        isDelegatedAccessAvailable: false,
        isNonPrivateDelegatedAccessAvailable: false,
        // Disabled on VPN because it can't use delegated access, so we don't display the recovery score either.
        isRecoveryScoreBannerAvailable: false,
    };

    const flags: Flags = {
        canDisplayNonPrivateEmailPhone: false,
        isAuthenticatorAvailable: false,
        isCategoryViewEnabled: false,
        isCryptoPostQuantumOptInEnabled: false,
        isMspEnabled: false,
        isScribeEnabled: false,
        isUserGroupsFeatureEnabled,
        isUserGroupsNoCustomDomainEnabled,
        isUserGroupsPassBusinessEnabled,
        isZoomIntegrationEnabled,
        isProtonMeetIntegrationEnabled,
        isSharedServerFeatureEnabled,
        isSsoForPbsEnabled,
        isRetentionPoliciesEnabled,
        isAlwaysOnVpnEnabled,
        isReferralProgramEnabled,
    };

    const vpnRoutes = getRoutes({
        user,
        subscription,
        showVPNDashboard,
        showVPNDashboardVariant: showVPNDashboardVariant.name,
        referralInfo: referralInfo.uiData,
        recoveryNotification: recoveryNotification?.color,
        organizationSettingsRouterParams,
        flags,
        accountRecoveryRouterFlags,
    });

    const organizationAppRoutes = getOrganizationAppRoutes({
        app: APPS.PROTONVPN_SETTINGS,
        user,
        subscription,
        entitlements,
        flags,
        ...organizationSettingsRouterParams,
    });

    const [{ ignoreOnboarding }] = useState(() => {
        return {
            ignoreOnboarding: location.pathname !== '/downloads',
        };
    });
    const app = APPS.PROTONVPN_SETTINGS;

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    const top = (
        <TopBanners app={APPS.PROTONVPN_SETTINGS}>
            <SSODomainUnverifiedBanner app={APPS.PROTONVPN_SETTINGS} />
            <MembersAuthDevicesTopBanner />
        </TopBanners>
    );

    const header = (
        <PrivateHeader
            app={app}
            userDropdown={<UserDropdown app={app} onOpenChat={handleOpenZendeskChat} />}
            upsellButton={<TopNavbarUpsell offerProps={{ ignoreOnboarding }} app={app} />}
            title={c('Title').t`Settings`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isSmallViewport={viewportWidth['<=small']}
            actionArea={<SettingsSearchArea />}
            onBoardingButton={<GetStartedOnboarding />}
        />
    );

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
            permissions === null ||
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
            <Switch>
                <Route path={VPN_TV_PATHS}>
                    <UnAuthenticated>
                        <TVContainer />
                    </UnAuthenticated>
                </Route>
                <Route path="*">
                    <NavigationProvider>
                        <PrivateAppContainer
                            top={top}
                            header={header}
                            sidebar={
                                <VPNSidebar
                                    routes={vpnRoutes}
                                    organizationRoutes={organizationAppRoutes}
                                    sidebarExpanded={expanded}
                                    onSidebarToggle={onToggleExpand}
                                />
                            }
                        >
                            <Switch>
                                {getIsSectionAvailable(vpnRoutes.dashboardV2) && (
                                    <Route path={vpnRoutes.dashboardV2.to}>
                                        <DashboardTelemetry app={app} />
                                        <AutomaticSubscriptionModal />
                                        <UpsellModalTelemetryProvider context="account-home">
                                            <PrivateMainSettingsArea
                                                config={vpnRoutes.dashboardV2}
                                                mainAreaClass="bg-lowered settings-cards"
                                                wrapperClass="w-full p-4 lg:pt-6 xl:pt-12 max-w-custom mx-0 lg:mx-4 xl:mx-6 xxl:mx-14 transition-spacings"
                                                style={{ '--max-w-custom': SettingsCardMaxWidth.Wide }}
                                            >
                                                <YourPlanSectionV2 app={app} />
                                                <YourPlanUpsellsSectionV2 app={app} />
                                                <VPNDownloadAndInfoSection app={app} />
                                                <VpnAlsoInYourPlanSection app={app} />
                                                <VpnBlogSection />
                                            </PrivateMainSettingsArea>
                                        </UpsellModalTelemetryProvider>
                                    </Route>
                                )}
                                {getIsSectionAvailable(vpnRoutes.subscription) && (
                                    <Route path={vpnRoutes.subscription.to}>
                                        <AutomaticSubscriptionModal />
                                        <UpsellModalTelemetryProvider context="account-home">
                                            <PrivateMainSettingsArea
                                                config={vpnRoutes.subscription}
                                                mainAreaClass="bg-lowered settings-cards"
                                                wrapperClass="w-full p-4 lg:pt-6 xl:pt-12 max-w-custom mx-0 lg:mx-4 xl:mx-6 xxl:mx-14 transition-spacings"
                                                style={{ '--max-w-custom': SettingsCardMaxWidth.Wide }}
                                            >
                                                <YourPlanSectionV2
                                                    app={app}
                                                    editBillingCycle={true}
                                                    cta={<DashboardComparePlansCTA app={app} />}
                                                />
                                                <SubscriptionsSection />
                                                <PaymentMethodsSection app={app} />
                                                <CreditsSection app={app} />
                                                <GiftCodeSection />
                                                <InvoicesSection app={app} />
                                                <CancelSubscriptionSection app={app} />
                                                <DowngradeSubscriptionSection app={app} />
                                                <CancelSubscriptionViaSupportSection />
                                            </PrivateMainSettingsArea>
                                        </UpsellModalTelemetryProvider>
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
                                        <RecoverySettingsRouter app={app} recovery={vpnRoutes.recovery} path="" />
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
                                        <EmailSubscriptionSection toggleContainerClassName="gap-4" />
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
                                    <DownloadsRoute legacyRouteConfig={vpnRoutes.downloads} />
                                </Route>
                                {getIsSectionAvailable(vpnRoutes.referral) && (
                                    <Route path={vpnRoutes.referral.to}>
                                        <ReferralPageTelemetry />
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
                                        onOpenChat={handleOpenZendeskChat}
                                        organization={organization}
                                        entitlements={entitlements}
                                    />
                                </Route>
                                <Route path={`${CANCEL_ROUTE}`}>
                                    <CancellationReminderSection app={APPS.PROTONVPN_SETTINGS} />
                                </Route>
                                {redirect}
                            </Switch>
                            {showZendeskChat.render && (
                                <LiveChatZendesk
                                    tags={getZendeskTags(user, organization)}
                                    zendeskRef={zendeskRef}
                                    autoLaunch={showZendeskChat.autoLaunch}
                                    locale={localeCode.replace('_', '-')}
                                />
                            )}
                        </PrivateAppContainer>
                    </NavigationProvider>
                </Route>
            </Switch>
        </SubscriptionModalProvider>
    );
};

export default MainContainer;
