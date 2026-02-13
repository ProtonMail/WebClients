import { Suspense, lazy, useEffect } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { OutgoingEmergencyContactTopBanner } from '@proton/account/delegatedAccess/emergencyContact/outgoing/OutgoingEmergencyContactTopBanner';
import { IncomingRecoveryContactTopBanner } from '@proton/account/delegatedAccess/recoveryContact/incoming/IncomingRecoveryContactTopBanner';
import { OutgoingRecoveryContactTopBanner } from '@proton/account/delegatedAccess/recoveryContact/outgoing/OutgoingRecoveryContactTopBanner';
import { getTrustedContactRoute } from '@proton/account/delegatedAccess/routes';
import { useGroupMemberships } from '@proton/account/groupMemberships/hooks';
import { useGroups } from '@proton/account/groups/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import AuthDevicesTopBanner from '@proton/account/sso/AuthDevicesTopBanner';
import MembersAuthDevicesTopBanner from '@proton/account/sso/MembersAuthDevicesTopBanner';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserInvitations } from '@proton/account/userInvitations/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import {
    AppLink,
    CancellationReminderSection,
    ContactEmailsProvider,
    CustomLogo,
    Logo,
    PassForBusinessLogo,
    PrivateAppContainer,
    PrivateHeader,
    PrivateMainAreaLoading,
    SubscriptionModalProvider,
    TVContainer,
    TopBanners,
    TopNavbarUpsell,
    UserDropdown,
    useActiveBreakpoint,
    useDeviceRecovery,
    useDrivePlan,
    useIsDataRecoveryAvailable,
    useIsSessionRecoveryAvailable,
    useOrganizationTheme,
    useRecoveryNotification,
    useShowThemeSelection,
    useToggle,
} from '@proton/components';
import FeatureTour from '@proton/components/components/featureTour/FeatureTour';
import SSODomainUnverifiedBanner from '@proton/components/containers/account/sso/SSODomainUnverifiedBanner';
import { getIsSectionAvailable, getRoutePaths } from '@proton/components/containers/layout/helper';
import UnprivatizationRequestTopBanner from '@proton/components/containers/members/Unprivatization/UnprivatizationRequestTopBanner';
import { CANCEL_ROUTE } from '@proton/components/containers/payments/subscription/cancellationFlow/helper';
import useShowDashboard from '@proton/components/hooks/accounts/useShowDashboard';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import { useIsGroupOwner } from '@proton/components/hooks/useIsGroupOwner';
import useShowVPNDashboard from '@proton/components/hooks/useShowVPNDashboard';
import { FeatureCode, useFeatures } from '@proton/features';
import { getHasPassB2BPlan, hasAIAssistant, hasAllProductsB2CPlan } from '@proton/payments';
import { useIsB2BTrial } from '@proton/payments/ui';
import { getAvailableApps } from '@proton/shared/lib/apps/apps';
import { getAppFromPathnameSafe, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { getToApp } from '@proton/shared/lib/authentication/apps';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS, SETUP_ADDRESS_PATH, VPN_TV_PATHS } from '@proton/shared/lib/constants';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { getPathFromLocation } from '@proton/shared/lib/helpers/url';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { getRequiresAddressSetup } from '@proton/shared/lib/keys';
import { hasPaidPass } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash';

import AccountSettingsRouter from '../containers/account/AccountSettingsRouter';
import { recoveryIds } from '../containers/account/recoveryIds';
import OrganizationSettingsRouter from '../containers/organization/OrganizationSettingsRouter';
import AccountSidebar from './AccountSidebar';
import AccountStartupModals from './AccountStartupModals';
import SettingsSearch from './SettingsSearch';
import { getRoutes } from './routes';

const MailSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/MailSettingsRouter" */ '../containers/mail/MailSettingsRouter')
);
const CalendarSettingsRouter = lazy(
    () =>
        import(/* webpackChunkName: "routers/CalendarSettingsRouter" */ '../containers/calendar/CalendarSettingsRouter')
);
const VpnSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/VpnSettingsRouter" */ '../containers/vpn/VpnSettingsRouter')
);
const DriveSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/DriveSettingsRouter" */ '../containers/drive/DriveSettingsRouter')
);
const DocsSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/DocsSettingsRouter" */ '../containers/docs/DocsSettingsRouter')
);
const PassSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/PassSettingsRouter" */ '../containers/pass/PassSettingsRouter')
);

const WalletSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/WalletSettingsRouter" */ '../containers/wallet/WalletSettingsRouter')
);

const MeetSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/MeetSettingsRouter" */ '../containers/meet/MeetSettingsRouter')
);

const AuthenticatorSettingsRouter = lazy(
    () =>
        import(
            /* webpackChunkName: "routers/AuthenticatorSettingsRouter" */ '../containers/authenticator/AuthenticatorSettingsRouter'
        )
);

const mailSlug = getSlugFromApp(APPS.PROTONMAIL);
const calendarSlug = getSlugFromApp(APPS.PROTONCALENDAR);
const vpnSlug = getSlugFromApp(APPS.PROTONVPN_SETTINGS);
const driveSlug = getSlugFromApp(APPS.PROTONDRIVE);
const docsSlug = getSlugFromApp(APPS.PROTONDOCS);
const walletSlug = getSlugFromApp(APPS.PROTONWALLET);
const passSlug = getSlugFromApp(APPS.PROTONPASS);
const meetSlug = getSlugFromApp(APPS.PROTONMEET);
const authenticatorSlug = getSlugFromApp(APPS.PROTONAUTHENTICATOR);

const getDefaultPassRedirect = (
    user: UserModel,
    accountRoutes: ReturnType<typeof getRoutes>['account'],
    passRoutes: ReturnType<typeof getRoutes>['pass']
) => {
    if (hasPaidPass(user) || !user.canPay || !getIsSectionAvailable(accountRoutes.routes.dashboard)) {
        return passRoutes.routes.downloads.to;
    }
    return accountRoutes.routes.dashboard.to;
};

const getDefaultAuthenticatorRedirect = (authenticatorRoutes: ReturnType<typeof getRoutes>['authenticator']) => {
    return authenticatorRoutes.routes.downloads.to;
};

const getDefaultRedirect = (accountRoutes: ReturnType<typeof getRoutes>['account']) => {
    if (getIsSectionAvailable(accountRoutes.routes.vpnDashboardV2)) {
        return `${accountRoutes.routes.vpnDashboardV2.to}${location.search}${location.hash}`;
    }
    if (getIsSectionAvailable(accountRoutes.routes.dashboard)) {
        return `${accountRoutes.routes.dashboard.to}${location.search}${location.hash}`;
    }
    if (getIsSectionAvailable(accountRoutes.routes.recovery)) {
        return accountRoutes.routes.recovery.to;
    }
    if (getIsSectionAvailable(accountRoutes.routes.password)) {
        return accountRoutes.routes.password.to;
    }
    const config = Object.values(accountRoutes.routes).find((config) => {
        if (getIsSectionAvailable(config)) {
            return config;
        }
    });
    return config?.to || '';
};

const MainContainer = () => {
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [addresses] = useAddresses();
    const [organization, loadingOrganization] = useOrganization();
    const [subscription, loadingSubscription] = useSubscription();
    const location = useLocation();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { viewportWidth } = useActiveBreakpoint();

    useFeatures([FeatureCode.EasySwitch]);

    const showThemeSelection = useShowThemeSelection();
    const canDisplayB2BLogsPass = useFlag('B2BLogsPass');
    const canDisplayB2BLogsVPN = useFlag('B2BLogsVPN');
    const isUserGroupsFeatureEnabled = useFlag('UserGroupsPermissionCheck');
    const isUserGroupsNoCustomDomainEnabled = useFlag('UserGroupsNoCustomDomain');
    const isB2BAuthLogsEnabled = useFlag('B2BAuthenticationLogs');
    const { paymentsEnabled: isScribePaymentEnabled } = useAssistantFeatureEnabled();
    const isScribeAdminSettingFeatureEnabled = useFlag('ScribeAdminSetting');
    const isZoomIntegrationEnabled = useFlag('ZoomIntegration');
    const isProtonMeetIntegrationEnabled = useFlag('NewScheduleOption');
    const canB2BHidePhotos = useFlag('DriveB2BPhotosUpload');
    const isSharedServerFeatureEnabled = useFlag('SharedServerFeature');
    const isCryptoPostQuantumOptInEnabled =
        (useFlag('CryptoPostQuantumOptIn') && user.isPrivate) || !!userSettings.Flags.SupportPgpV6Keys;
    const canDisplayPassReports = useFlag('PassB2BReports');
    const isDocsHomepageAvailable = useFlag('DriveDocsLandingPageEnabled');
    const isSheetsAvailable = useFlag('DocsSheetsEnabled');
    const isSsoForPbsEnabled = useFlag('SsoForPbs');
    const isRetentionPoliciesEnabled = useFlag('DataRetentionPolicy');
    const isMeetAvailable = useFlag('PMVC2025');
    const isAuthenticatorAvailable = useFlag('AuthenticatorSettingsEnabled');
    const isOLESEnabled = useFlag('OlesM1');
    const isCategoryViewEnabled = useFlag('CategoryView');
    const isRecoveryContactsEnabled = useFlag('SocialRecovery');
    const isRolesAndPermissionsEnabled = useFlag('AdminRoleMVP');

    const [referralInfo] = useReferralInfo();

    const [isDataRecoveryAvailable, loadingDataRecovery] = useIsDataRecoveryAvailable();
    const [isSessionRecoveryAvailable, loadingIsSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const recoveryNotification = useRecoveryNotification(false, false);

    const appFromPathname = getAppFromPathnameSafe(location.pathname);
    const app = appFromPathname || getToApp(undefined, user);
    const appSlug = getSlugFromApp(app);

    // We hide the assistant upsell for users on Mail and Calendar app without the assistant when the kill switch is enabled
    const hasAssistant = hasAIAssistant(subscription);
    const hasAllProducts = hasAllProductsB2CPlan(subscription);
    const isInAllowedApps =
        hasAllProducts || appFromPathname === APPS.PROTONMAIL || appFromPathname === APPS.PROTONCALENDAR;
    const assistantKillSwitch = isInAllowedApps ? !hasAssistant : true;

    const organizationTheme = useOrganizationTheme();
    const [memberships, loadingGroupMembership] = useGroupMemberships();
    const [groups, loadingGroups] = useGroups();

    const { showVPNDashboard, showVPNDashboardVariant } = useShowVPNDashboard(app);
    const { showDashboard: showMailDashboard, variant: showMailDashboardVariant } = useShowDashboard(
        app,
        'MailDashboard'
    );
    const { showDashboard: showPassDashboard, variant: showPassDashboardVariant } = useShowDashboard(
        app,
        'PassDashboard'
    );

    const { showDashboard: showDriveDashboard, variant: showDriveDashboardVariant } = useShowDashboard(
        app,
        'DriveDashboard'
    );

    const { showDashboard: showMeetDashboard, variant: showMeetDashboardVariant } = useShowDashboard(
        app,
        'MeetDashboard'
    );

    const { isB2B: isB2BDrive } = useDrivePlan();

    const isB2BTrial = useIsB2BTrial(subscription, organization);
    const [isGroupOwner, loadingIsGroupOwner] = useIsGroupOwner();

    const canDisplayNonPrivateEmailPhone = useFlag('B2BNonPrivateEmailPhone');

    const [invites = []] = useUserInvitations();
    const hasPendingInvitations = invites.length > 0;

    const routes = getRoutes({
        app,
        user,
        addresses,
        organization,
        subscription,
        isReferralProgramEnabled: Boolean(userSettings.Referral?.Eligible),
        isDataRecoveryAvailable,
        isSessionRecoveryAvailable,
        recoveryNotification: recoveryNotification?.color,
        showVPNDashboard,
        showVPNDashboardVariant: showVPNDashboardVariant.name,
        isUserGroupsFeatureEnabled,
        showThemeSelection,
        assistantKillSwitch,
        isRecoveryContactsEnabled,
        canDisplayB2BLogsPass,
        canDisplayB2BLogsVPN,
        canDisplayPassReports,
        memberships,
        groups,
        isUserGroupsNoCustomDomainEnabled,
        canB2BHidePhotos,
        isB2BDrive,
        isB2BAuthLogsEnabled,
        isScribeEnabled: isScribePaymentEnabled && isScribeAdminSettingFeatureEnabled,
        isZoomIntegrationEnabled,
        isProtonMeetIntegrationEnabled,
        isSharedServerFeatureEnabled,
        isCryptoPostQuantumOptInEnabled,
        isB2BTrial,
        isRetentionPoliciesEnabled,
        isSsoForPbsEnabled,
        referralInfo: referralInfo.uiData,
        canDisplayNonPrivateEmailPhone,
        showMailDashboard,
        showMailDashboardVariant: showMailDashboardVariant.name,
        showPassDashboard,
        showPassDashboardVariant: showPassDashboardVariant.name,
        showDriveDashboard,
        showDriveDashboardVariant: showDriveDashboardVariant.name,
        showMeetDashboard,
        showMeetDashboardVariant: showMeetDashboardVariant.name,
        isAuthenticatorAvailable,
        hasPendingInvitations,
        isGroupOwner,
        isOLESEnabled,
        isCategoryViewEnabled,
        isRolesAndPermissionsEnabled,
    });

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    useDeviceRecovery();

    /*
     * There's no logical app to return/go to from VPN settings since the
     * vpn web app is also settings which you are already in. Redirect to
     * the default path in account in that case.
     */
    const isLocal = [APPS.PROTONVPN_SETTINGS].includes(app as any);
    const toApp = isLocal ? APPS.PROTONACCOUNT : app;
    const to = isLocal ? `/${getSlugFromApp(app)}` : '/';
    const pathPrefix = `/${appSlug}`;

    const hasPassB2bPlan = getHasPassB2BPlan(subscription);

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

        if (app === APPS.PROTONPASS && hasPassB2bPlan) {
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
            <IncomingRecoveryContactTopBanner />
            <OutgoingRecoveryContactTopBanner />
            <OutgoingEmergencyContactTopBanner />
            <UnprivatizationRequestTopBanner />
            <SSODomainUnverifiedBanner app={app} />
            <AuthDevicesTopBanner />
            <MembersAuthDevicesTopBanner />
        </TopBanners>
    );

    const header = (
        <PrivateHeader
            userDropdown={<UserDropdown app={app} sessionOptions={{ path: pathPrefix }} />}
            // No onboarding in account
            upsellButton={<TopNavbarUpsell offerProps={{ ignoreOnboarding: true }} app={app} />}
            title={c('Title').t`Settings`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isSmallViewport={viewportWidth['<=small']}
            actionArea={viewportWidth['>=large'] && <SettingsSearch routes={routes} path={pathPrefix} app={app} />}
            app={app}
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

    // Switch can't reasonably traverse Router childrens. However we do want to place them in their own components
    // and still have redirects working. This is a trick to short-circuit matches of these paths to specific routers.
    // A better idea would be to use a prefix for account and org. /mail/account/dashboard etc.
    const anyAccountAppRoute = getRoutePaths(pathPrefix, Object.values(routes.account.routes));
    const anyOrganizationAppRoute = getRoutePaths(
        pathPrefix,
        Object.values(routes.organization.routes).filter((section) => {
            // Filter out the domains section, the route clashes with the _same_ route in the mail router when
            // it's not available and would take precedence in the routing. (E.g. for free users).
            return !(section === routes.organization.routes.domains && !getIsSectionAvailable(section));
        })
    );

    const redirect = (() => {
        if (
            loadingOrganization ||
            loadingSubscription ||
            loadingDataRecovery ||
            loadingIsSessionRecoveryAvailable ||
            loadingGroupMembership ||
            loadingGroups ||
            loadingIsGroupOwner
        ) {
            return <PrivateMainAreaLoading />;
        }

        const pathFromLocation = getPathFromLocation(location);

        if (!appFromPathname) {
            return <Redirect to={`/${appSlug}${pathFromLocation}`} />;
        }

        const path = (() => {
            if (app === APPS.PROTONPASS) {
                return getDefaultPassRedirect(user, routes.account, routes.pass);
            }
            if (app === APPS.PROTONAUTHENTICATOR) {
                return getDefaultAuthenticatorRedirect(routes.authenticator);
            }
            return getDefaultRedirect(routes.account);
        })();

        return <Redirect to={`/${appSlug}${path}`} />;
    })();

    if (
        getRequiresAddressSetup(app, user) &&
        location.pathname !== `${pathPrefix}${routes.account.routes.password.to}`
    ) {
        const toPath = `/${stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(location.pathname))}`;
        return <Redirect to={`${SETUP_ADDRESS_PATH}?to=${app}&to-type=settings&to-path=${toPath}`} />;
    }

    // Special case to render outside of the main container
    if (app === APPS.PROTONVPN_SETTINGS && VPN_TV_PATHS.some((path) => `/${appSlug}${path}` === location.pathname)) {
        return <TVContainer />;
    }

    const availableApps = getAvailableApps({
        user,
        context: 'app',
        organization,
        isDocsHomepageAvailable,
        isMeetAvailable,
        isSheetsAvailable,
        isAuthenticatorAvailable,
    });

    // Should never happen that available apps is empty, but just as a safety mechanism anyway
    if (
        !availableApps.includes(app) &&
        appFromPathname /* wait for app in pathname to ensure replacement works */ &&
        availableApps.length
    ) {
        const [firstAvailableApp] = availableApps;
        const locationWithNewApp = getPathFromLocation(location).replace(
            pathPrefix,
            `/${getSlugFromApp(firstAvailableApp)}`
        );
        return <Redirect to={locationWithNewApp} />;
    }

    return (
        <SubscriptionModalProvider app={app}>
            <PrivateAppContainer top={top} header={header} sidebar={sidebar}>
                <AccountStartupModals />
                <FeatureTour />
                <Switch>
                    <Route path={anyAccountAppRoute}>
                        <AccountSettingsRouter
                            app={app}
                            path={pathPrefix}
                            accountAppRoutes={routes.account}
                            redirect={redirect}
                        />
                    </Route>
                    <Route path={[getTrustedContactRoute(`/${appSlug}`), getTrustedContactRoute()]}>
                        <Redirect
                            to={`/${appSlug}${routes.account.routes.recovery.to}${location.search}${location.hash || `#${recoveryIds.emergencyAccess}`}`}
                        />
                    </Route>
                    <Route path={anyOrganizationAppRoute}>
                        <OrganizationSettingsRouter
                            app={app}
                            path={pathPrefix}
                            organizationAppRoutes={routes.organization}
                            redirect={redirect}
                            user={user}
                            organization={organization}
                            subscription={subscription}
                        />
                    </Route>
                    <Route path={`/${appSlug}${CANCEL_ROUTE}`}>
                        <CancellationReminderSection app={app} />
                    </Route>
                    <Route path={`/${mailSlug}`}>
                        <Suspense fallback={<PrivateMainAreaLoading />}>
                            <MailSettingsRouter mailAppRoutes={routes.mail} redirect={redirect} />
                        </Suspense>
                    </Route>
                    <Route path={`/${calendarSlug}`}>
                        <Suspense fallback={<PrivateMainAreaLoading />}>
                            <ContactEmailsProvider>
                                <CalendarSettingsRouter
                                    user={user}
                                    subscription={subscription}
                                    calendarAppRoutes={routes.calendar}
                                    redirect={redirect}
                                />
                            </ContactEmailsProvider>
                        </Suspense>
                    </Route>
                    <Route path={`/${vpnSlug}`}>
                        <Suspense fallback={<PrivateMainAreaLoading />}>
                            <VpnSettingsRouter vpnAppRoutes={routes.vpn} redirect={redirect} />
                        </Suspense>
                    </Route>
                    <Route path={`/${driveSlug}`}>
                        <Suspense fallback={<PrivateMainAreaLoading />}>
                            <DriveSettingsRouter driveAppRoutes={routes.drive} redirect={redirect} />
                        </Suspense>
                    </Route>
                    <Route path={`/${docsSlug}`}>
                        <Suspense fallback={<PrivateMainAreaLoading />}>
                            <DocsSettingsRouter docsAppRoutes={routes.docs} redirect={redirect} />
                        </Suspense>
                    </Route>
                    <Route path={`/${walletSlug}`}>
                        <Suspense fallback={<PrivateMainAreaLoading />}>
                            <WalletSettingsRouter walletAppRoutes={routes.wallet} redirect={redirect} />
                        </Suspense>
                    </Route>
                    <Route path={`/${passSlug}`}>
                        <Suspense fallback={<PrivateMainAreaLoading />}>
                            <PassSettingsRouter passAppRoutes={routes.pass} redirect={redirect} />
                        </Suspense>
                    </Route>
                    <Route path={`/${meetSlug}`}>
                        <Suspense fallback={<PrivateMainAreaLoading />}>
                            <MeetSettingsRouter meetAppRoutes={routes.meet} redirect={redirect} />
                        </Suspense>
                    </Route>
                    <Route path={`/${authenticatorSlug}`}>
                        <Suspense fallback={<PrivateMainAreaLoading />}>
                            <AuthenticatorSettingsRouter
                                authenticatorAppRoutes={routes.authenticator}
                                redirect={redirect}
                            />
                        </Suspense>
                    </Route>
                    {redirect}
                </Switch>
            </PrivateAppContainer>
        </SubscriptionModalProvider>
    );
};

export default MainContainer;
