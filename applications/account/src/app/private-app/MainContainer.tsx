import { useEffect } from 'react';
import { Redirect, matchPath, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import PasswordReminderTopBanner from '@proton/account-recovery/passwordReminder/PasswordReminderTopBanner';
import AuthDevicesTopBanner from '@proton/account-security/sso/AuthDevicesTopBanner';
import MembersAuthDevicesTopBanner from '@proton/account-security/sso/MembersAuthDevicesTopBanner';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useAvailableApps } from '@proton/account/availableApps/hooks';
import {
    getIsIncomingDelegatedAccessAvailable,
    getIsOutgoingDelegatedAccessAvailable,
} from '@proton/account/delegatedAccess/available';
import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useGroupMemberships } from '@proton/account/groupMemberships/hooks';
import { useGroups } from '@proton/account/groups/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { usePasswordReminder } from '@proton/account/passwordReminder/hooks';
import { useIsDataRecoveryAvailable } from '@proton/account/recovery/dataRecovery';
import { useIsSessionRecoveryAvailable } from '@proton/account/recovery/sessionRecoveryHooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserInvitations } from '@proton/account/userInvitations/hooks';
import { EMPTY_ORG_PERMISSIONS } from '@proton/account/userPermissions';
import { useIsOrganizationOwner, useUserPermissions } from '@proton/account/userPermissions/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import FeatureTour from '@proton/components/components/featureTour/FeatureTour';
import AppLink from '@proton/components/components/link/AppLink';
import CustomLogo from '@proton/components/components/logo/CustomLogo';
import Logo from '@proton/components/components/logo/Logo';
import PassForBusinessLogo from '@proton/components/components/logo/PassForBusinessLogo';
import TopNavbarListItem from '@proton/components/components/topnavbar/TopNavbarListItem';
import TopNavbarUpsell from '@proton/components/components/topnavbar/TopNavbarUpsell';
import SSODomainUnverifiedBanner from '@proton/components/containers/account/sso/SSODomainUnverifiedBanner';
import PrivateAppContainer from '@proton/components/containers/app/PrivateAppContainer';
import PrivateHeader from '@proton/components/containers/heading/PrivateHeader';
import UserDropdown from '@proton/components/containers/heading/UserDropdown';
import { useOrganizationTheme } from '@proton/components/containers/organization/logoUpload/useOrganizationTheme';
import { useReferralUserEligible } from '@proton/components/containers/referral/hooks/useReferralUserEligible';
import TopBanners from '@proton/components/containers/topBanners/TopBanners';
import LiveChatZendesk from '@proton/components/containers/zendesk/LiveChatZendesk';
import { getZendeskTags } from '@proton/components/containers/zendesk/helper';
import { useZendeskChat } from '@proton/components/containers/zendesk/useZendeskChat';
import useShowDashboard, {
    useShowDriveDashboard,
    useShowGenericDashboard,
} from '@proton/components/hooks/accounts/useShowDashboard';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useIsGroupOwner } from '@proton/components/hooks/useIsGroupOwner';
import useRecoveryNotification from '@proton/components/hooks/useRecoveryNotification';
import useShowThemeSelection from '@proton/components/hooks/useShowThemeSelection';
import useShowVPNDashboard from '@proton/components/hooks/useShowVPNDashboard';
import { OutgoingEmergencyContactTopBanner } from '@proton/delegated-access/emergencyContact/outgoing/OutgoingEmergencyContactTopBanner';
import { IncomingRecoveryContactTopBanner } from '@proton/delegated-access/recoveryContact/incoming/IncomingRecoveryContactTopBanner';
import { OutgoingRecoveryContactTopBanner } from '@proton/delegated-access/recoveryContact/outgoing/OutgoingRecoveryContactTopBanner';
import useToggle from '@proton/hooks/useToggle';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { OfferTopBanner } from '@proton/offers-delivery/components/OfferTopBanner';
import { useOfferNavbarEntry } from '@proton/offers-delivery/components/useOfferNavbarEntry';
import SubscriptionModalProvider from '@proton/payments-ui/containers/payments/subscription/SubscriptionModalProvider';
import AccountSidebar from '@proton/settings/AccountSidebar';
import { SettingsRoutes, SettingsSearchArea } from '@proton/settings/SettingsRoutes';
import UnprivatizationRequestTopBanner from '@proton/settings/containers/members/Unprivatization/UnprivatizationRequestTopBanner';
import PendingInvitationTopBanner from '@proton/settings/containers/pendingInvitations/PendingInvitationTopBanner';
import type {
    AccountRecoveryRouterFlags,
    AccountSettingsRouterParams,
    Flags,
    OrganizationSettingsRouterParams,
} from '@proton/settings/router-params';
import { getRoutes } from '@proton/settings/routes';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS, SETUP_ADDRESS_PATH, VPN_TV_PATHS, VPN_TV_PATH_WITH_CODE } from '@proton/shared/lib/constants';
import { getIsAccountRecoveryAvailable } from '@proton/shared/lib/helpers/recovery';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { getPathFromLocation } from '@proton/shared/lib/helpers/url';
import { localeCode } from '@proton/shared/lib/i18n';
import { getRequiresAddressSetup } from '@proton/shared/lib/keys/setupAddress';
import { useFlag } from '@proton/unleash/useFlag';
import { GetStartedOnboarding } from '@proton/vpn/components/Onboarding';
import { TVContainer } from '@proton/vpn/components/tv/containers/TVContainer';
import { TvContainerSignedIn } from '@proton/vpn/components/tv/containers/TvContainerSignedIn';
import { NavigationProvider } from '@proton/vpn/contexts/navigation';

import Layout from '../public-app/layout/Layout';
import Main from '../public-app/layout/Main';
import AccountStartupModals from './AccountStartupModals';
import { getAssistantKillSwitch } from './assistantKillSwitch';
import { useSettingsApp } from './useSettingsApp';

const MainContainerContent = () => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [addresses] = useAddresses();
    const [organization, loadingOrganization] = useOrganization();
    const [subscription, loadingSubscription] = useSubscription();
    const [allSubscriptions = [], loadingAllSubscriptions] = useAllSubscriptions();
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();
    const [{ permissions }] = useUserPermissions();
    const [isOrganizationOwner] = useIsOrganizationOwner();
    const availableApps = useAvailableApps();
    const location = useLocation();

    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { viewportWidth } = useActiveBreakpoint();

    const showThemeSelection = useShowThemeSelection();
    const { paymentsEnabled: isScribePaymentEnabled } = useAssistantFeatureEnabled();
    const isScribeAdminSettingFeatureEnabled = useFlag('ScribeAdminSetting');
    const isZoomIntegrationDisabled = useFlag('ZoomIntegrationDisabled');
    const isProtonMeetIntegrationEnabled = useFlag('NewScheduleOption');
    const isAlwaysOnVpnEnabled = useFlag('B2BAlwaysOnEnabled');
    const isCryptoPostQuantumOptInEnabled =
        (useFlag('CryptoPostQuantumOptIn') && user.isPrivate) || !!userSettings.Flags.SupportPgpV6Keys;
    const isSsoForPbsEnabled = useFlag('SsoForPbs');
    const showSignInRestrictionToggle = useFlag('ShowSignInRestrictionToggle');
    const isMemberResetEnabled = useFlag('MemberResetLink');
    const isRetentionPoliciesEnabled = useFlag('DataRetentionPolicy');
    const isReferralB2C2BEnabled = useFlag('ReferralProgramB2C2B');
    const isLumoApiEnabled = useFlag('LumoAPIKeyManagement');
    const isServiceAccountsEnabled = useFlag('ServiceAccounts');
    const isDriveEasySwitchEnabled = useFlag('EasySwitchB2CForDriveWeb');
    const isDriveEasySwitchNewUIEnabled = useFlag('EasySwitchB2CForDriveWebNewUI') && isDriveEasySwitchEnabled;

    const { canUseCategoryView } = useCategoriesData();

    const [referralInfo] = useReferralInfo();

    const [{ isMnemonicAvailable, isRecoveryFileAvailable, isDataRecoveryAvailable }, loadingDataRecovery] =
        useIsDataRecoveryAvailable();
    const [isSessionRecoveryAvailable, loadingIsSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const recoveryNotification = useRecoveryNotification(false, false);

    const { app, appFromPathname, isGenericSettings } = useSettingsApp();
    const appSlug = isGenericSettings ? '' : getSlugFromApp(app);

    // We hide the assistant upsell for users on Mail and Calendar app without the assistant when the kill switch is enabled
    const isInAllowedApps =
        entitlements.hasAllCoreProductsB2C ||
        appFromPathname === APPS.PROTONMAIL ||
        appFromPathname === APPS.PROTONCALENDAR;
    const assistantKillSwitch = getAssistantKillSwitch({ isInAllowedApps, subscriptions: allSubscriptions });

    const organizationTheme = useOrganizationTheme();
    const [memberships, loadingGroupMembership] = useGroupMemberships();
    const [groups, loadingGroups] = useGroups();

    const { showVPNDashboard, showVPNDashboardVariant } = useShowVPNDashboard(app);
    const { showDashboard: showDriveDashboard, variant: showDriveDashboardVariant } = useShowDriveDashboard(app);
    const { showDashboard } = useShowDashboard(app);

    const canShowGenericDashboard = useShowGenericDashboard(app);

    const [isGroupOwner, loadingIsGroupOwner] = useIsGroupOwner();

    const canDisplayNonPrivateEmailPhone = useFlag('B2BNonPrivateEmailPhone');

    const [invites = []] = useUserInvitations();
    const hasPendingInvitations = invites.length > 0;

    const { isUserEligible: isReferralProgramEnabled } = useReferralUserEligible();
    const { isAvailable: isPasswordReminderAvailable } = usePasswordReminder();

    const accountRecoveryRouterFlags: AccountRecoveryRouterFlags = {
        isDelegatedAccessAvailable: user.isPrivate && getIsOutgoingDelegatedAccessAvailable(user),
        isNonPrivateDelegatedAccessAvailable: !user.isPrivate && getIsIncomingDelegatedAccessAvailable(user),
        isAccountRecoveryAvailable: getIsAccountRecoveryAvailable(user),
        isDataRecoveryAvailable,
        isSessionRecoveryAvailable,
        isMnemonicAvailable,
        isRecoveryFileAvailable,
        isRecoveryScoreBannerAvailable: true,
    };

    const accountSettingsRouterParams: AccountSettingsRouterParams = {
        accountRecoveryRouterFlags,
        recoveryNotification: recoveryNotification?.color,
        showVPNDashboard,
        showVPNDashboardVariant: showVPNDashboardVariant.name,
        showThemeSelection,
        assistantKillSwitch,
        referralInfo: referralInfo.uiData,
        showDashboard,
        showGenericDashboard: canShowGenericDashboard,
        showDriveDashboard,
        showDriveDashboardVariant: showDriveDashboardVariant.name,
        hasPendingInvitations,
        isPasswordReminderAvailable,
    };

    const organizationSettingsRouterParams: OrganizationSettingsRouterParams = {
        groups,
        organization,
        isGroupOwner,
        isOrganizationOwner,
        permissions: permissions ?? EMPTY_ORG_PERMISSIONS,
        memberships,
    };

    const flags: Flags = {
        canDisplayNonPrivateEmailPhone,
        isScribeEnabled: isScribePaymentEnabled && isScribeAdminSettingFeatureEnabled,
        isZoomIntegrationEnabled: !isZoomIntegrationDisabled,
        isProtonMeetIntegrationEnabled,
        isAlwaysOnVpnEnabled,
        isCryptoPostQuantumOptInEnabled,
        isSsoForPbsEnabled,
        isRetentionPoliciesEnabled,
        isServiceAccountsEnabled,
        isCategoryViewEnabled: canUseCategoryView,
        isLumoApiEnabled,
        isReferralProgramEnabled,
        isReferralBusinessEnabled: isReferralProgramEnabled && isReferralB2C2BEnabled,
        isDriveEasySwitchNewUIEnabled,
        showSignInRestrictionToggle,
        isMemberResetEnabled,
    };

    const routes = getRoutes({
        app,
        user,
        addresses,
        subscription,
        allSubscriptions,
        entitlements,
        accountSettingsRouterParams,
        organizationSettingsRouterParams,
        flags,
    });

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    /*
     * There's no logical app to return/go to from VPN settings since the
     * vpn web app is also settings which you are already in. Redirect to
     * the default path in account in that case.
     */
    const isLocal = [APPS.PROTONVPN_SETTINGS].includes(app as any);
    const toApp = isLocal ? APPS.PROTONACCOUNT : app;
    const to = isLocal ? `/${getSlugFromApp(app)}` : '/';
    const pathPrefix = isGenericSettings ? '' : `/${appSlug}`;

    // Zendesk Chat Integration
    const { handleOpenZendeskChat, showZendeskChat, zendeskRef } = useZendeskChat(user);

    const getLogo = () => {
        if (organizationTheme.logoURL) {
            return (
                <CustomLogo
                    url={organizationTheme.logoURL}
                    app={app}
                    organizationName={organizationTheme.name}
                    organizationNameDataTestId="sidebar:organization-name"
                />
            );
        }

        if (app === APPS.PROTONPASS && entitlements.isPassB2B) {
            return <PassForBusinessLogo />;
        }

        return <Logo appName={app} />;
    };

    const logo = (
        <AppLink
            to={to}
            toApp={toApp}
            target="_self"
            className="relative interactive-pseudo-protrude interactive--no-background text-no-decoration rounded-lg"
        >
            {getLogo()}
        </AppLink>
    );

    const top = (
        <TopBanners app={app}>
            <PendingInvitationTopBanner />
            <PasswordReminderTopBanner />
            <IncomingRecoveryContactTopBanner />
            <OutgoingRecoveryContactTopBanner />
            <OutgoingEmergencyContactTopBanner />
            <UnprivatizationRequestTopBanner />
            <SSODomainUnverifiedBanner app={app} />
            <AuthDevicesTopBanner />
            <MembersAuthDevicesTopBanner />
            <OfferTopBanner />
        </TopBanners>
    );

    const offerEntry = useOfferNavbarEntry();
    const offerNavbarItem = offerEntry.button && (
        <TopNavbarListItem collapsedOnDesktop={false} noShrink>
            {offerEntry.button}
        </TopNavbarListItem>
    );

    const header = (
        <PrivateHeader
            userDropdown={
                <UserDropdown app={app} sessionOptions={{ path: pathPrefix }} onOpenChat={handleOpenZendeskChat} />
            }
            upsellButton={offerNavbarItem ?? <TopNavbarUpsell offerProps={{ ignoreOnboarding: true }} app={app} />}
            title={c('Title').t`Settings`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isSmallViewport={viewportWidth['<=small']}
            actionArea={<SettingsSearchArea app={app} routes={routes} />}
            app={app}
            onBoardingButton={app === APPS.PROTONVPN_SETTINGS && <GetStartedOnboarding />}
        />
    );

    const sidebar = (
        <AccountSidebar
            app={app}
            appSlug={appSlug}
            logo={logo}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            routes={routes}
        />
    );

    if (
        getRequiresAddressSetup(app, user) &&
        location.pathname !== `${pathPrefix}${routes.account.routes.password.to}`
    ) {
        const toPath = `/${stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(location.pathname))}`;
        return <Redirect to={`${SETUP_ADDRESS_PATH}?to=${app}&to-type=settings&to-path=${toPath}`} />;
    }

    const match = matchPath<{ code: string }>(location.pathname, VPN_TV_PATH_WITH_CODE);
    if (app === APPS.PROTONVPN_SETTINGS && match) {
        return (
            <Layout toApp={APPS.PROTONVPN_SETTINGS} hasDecoration hasFooter={false} hasAppLogos={false}>
                <Main className="flex flex-column items-center justify-center">
                    <TvContainerSignedIn code={match.params.code} />
                </Main>
            </Layout>
        );
    }

    // Special case to render outside of the main container
    if (app === APPS.PROTONVPN_SETTINGS && VPN_TV_PATHS.some((path) => `/${appSlug}${path}` === location.pathname)) {
        return <TVContainer />;
    }

    // Redirect away from an app the user can't access, to the first one they can
    if (
        // The list is empty while it's loading, before the API first answers
        availableApps.length &&
        !availableApps.includes(app) &&
        appFromPathname /* wait for app in pathname to ensure replacement works */
    ) {
        const [firstAvailableApp] = availableApps;
        const locationWithNewApp = getPathFromLocation(location).replace(
            pathPrefix,
            `/${getSlugFromApp(firstAvailableApp)}`
        );
        return <Redirect to={locationWithNewApp} />;
    }

    return (
        <NavigationProvider prefix={pathPrefix}>
            <PrivateAppContainer top={top} header={header} sidebar={sidebar}>
                <AccountStartupModals />
                {offerEntry.modal}
                <FeatureTour />
                <SettingsRoutes
                    app={app}
                    appSlug={appSlug}
                    pathPrefix={pathPrefix}
                    user={user}
                    routes={routes}
                    loading={
                        loadingOrganization ||
                        loadingSubscription ||
                        loadingAllSubscriptions ||
                        loadingEntitlements ||
                        permissions === null ||
                        loadingDataRecovery ||
                        loadingIsSessionRecoveryAvailable ||
                        loadingGroupMembership ||
                        loadingGroups ||
                        loadingIsGroupOwner
                    }
                    organization={organization}
                    entitlements={entitlements}
                    onOpenChat={handleOpenZendeskChat}
                />
                {showZendeskChat.render && (
                    <LiveChatZendesk
                        userEmail={user.Email || userSettings?.Email?.Value}
                        tags={getZendeskTags(user, organization)}
                        zendeskRef={zendeskRef}
                        autoLaunch={showZendeskChat.autoLaunch}
                        locale={localeCode.replace('_', '-')}
                    />
                )}
            </PrivateAppContainer>
        </NavigationProvider>
    );
};

const MainContainer = () => {
    const { app } = useSettingsApp();

    return (
        <SubscriptionModalProvider app={app}>
            <MainContainerContent />
        </SubscriptionModalProvider>
    );
};

export default MainContainer;
