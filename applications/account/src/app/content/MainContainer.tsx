import { Suspense, lazy, useEffect } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import {
    AppLink,
    FeatureCode,
    Logo,
    PrivateAppContainer,
    PrivateHeader,
    PrivateMainAreaLoading,
    SectionConfig,
    TopBanners,
    TopNavbarUpsell,
    UserDropdown,
    useActiveBreakpoint,
    useAddresses,
    useDeviceRecovery,
    useFeatures,
    useIsDataRecoveryAvailable,
    useOrganization,
    useRecoveryNotification,
    useSubscription,
    useToggle,
    useUser,
    useUserSettings,
} from '@proton/components';
import ContactEmailsProvider from '@proton/components/containers/contacts/ContactEmailsProvider';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import useTelemetryScreenSize from '@proton/components/hooks/useTelemetryScreenSize';
import { DEFAULT_APP, getAppFromPathnameSafe, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { getRequiresAddressSetup } from '@proton/shared/lib/keys';

import AccountSettingsRouter from '../containers/account/AccountSettingsRouter';
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
const PassSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/PassSettingsRouter" */ '../containers/pass/PassSettingsRouter')
);

const mailSlug = getSlugFromApp(APPS.PROTONMAIL);
const calendarSlug = getSlugFromApp(APPS.PROTONCALENDAR);
const vpnSlug = getSlugFromApp(APPS.PROTONVPN_SETTINGS);
const driveSlug = getSlugFromApp(APPS.PROTONDRIVE);
const passSlug = getSlugFromApp(APPS.PROTONPASS);

const getRoutePaths = (prefix: string, sectionConfigs: SectionConfig[]) => {
    return sectionConfigs.map((section) => getSectionPath(prefix, section));
};

const getDefaultRedirect = (accountRoutes: ReturnType<typeof getRoutes>['account']) => {
    if (getIsSectionAvailable(accountRoutes.routes.dashboard)) {
        return accountRoutes.routes.dashboard.to;
    }
    if (getIsSectionAvailable(accountRoutes.routes.recovery)) {
        return accountRoutes.routes.recovery.to;
    }
    return accountRoutes.routes.password.to;
};

const MainContainer = () => {
    useTelemetryScreenSize();
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [addresses] = useAddresses();
    const [organization, loadingOrganization] = useOrganization();
    const [subscription, loadingSubscription] = useSubscription();
    const location = useLocation();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { isNarrow } = useActiveBreakpoint();

    const { featuresFlags, getFeature } = useFeatures([
        FeatureCode.SpyTrackerProtection,
        FeatureCode.ReferralProgram,
        FeatureCode.SmtpToken,
        FeatureCode.MailForwarding,
        FeatureCode.CalendarSharingEnabled,
        FeatureCode.HolidaysCalendars,
        FeatureCode.EasySwitch,
        FeatureCode.PassSettings,
        FeatureCode.PassPlusPlan,
        FeatureCode.OrgSpamBlockList,
        FeatureCode.ProtonSentinel,
        FeatureCode.AccessibilitySettings,
    ]);

    const referralProgramFeature = getFeature(FeatureCode.ReferralProgram);

    const isSpyTrackerEnabled = getFeature(FeatureCode.SpyTrackerProtection).feature?.Value === true;
    const isSmtpTokenEnabled = getFeature(FeatureCode.SmtpToken).feature?.Value === true;
    const isGmailSyncEnabled = getFeature(FeatureCode.EasySwitch).feature?.Value.GoogleMailSync === true;
    const isPassSettingsEnabled = getFeature(FeatureCode.PassSettings).feature?.Value === true;
    const isPassPlusEnabled = getFeature(FeatureCode.PassPlusPlan).feature?.Value === true;
    const isOrgSpamBlockListEnabled = getFeature(FeatureCode.OrgSpamBlockList).feature?.Value === true;
    const isProtonSentinelFeatureEnabled = getFeature(FeatureCode.ProtonSentinel).feature?.Value === true;
    const isAccessibilitySettingsEnabled = getFeature(FeatureCode.AccessibilitySettings).feature?.Value === true;

    const [isDataRecoveryAvailable, loadingDataRecovery] = useIsDataRecoveryAvailable();
    const loadingFeatures = featuresFlags.some(({ loading }) => loading) || loadingDataRecovery;
    const recoveryNotification = useRecoveryNotification(false);

    const routes = getRoutes({
        user,
        addresses,
        organization,
        subscription,
        isSpyTrackerEnabled,
        isReferralProgramEnabled: referralProgramFeature?.feature?.Value && userSettings.Referral?.Eligible,
        isSmtpTokenEnabled,
        isDataRecoveryAvailable,
        isGmailSyncEnabled,
        recoveryNotification: recoveryNotification?.color,
        isOrgSpamBlockListEnabled,
        isProtonSentinelEligible: !!userSettings.HighSecurity.Eligible,
        isProtonSentinelFeatureEnabled,
        isAccessibilitySettingsEnabled,
    });

    useEffect(() => {
        setExpand(false);
    }, [location.pathname, location.hash]);

    useDeviceRecovery();

    const app = getAppFromPathnameSafe(location.pathname) || DEFAULT_APP;
    const appSlug = getSlugFromApp(app);

    /*
     * There's no logical app to return/go to from VPN settings since the
     * vpn web app is also settings which you are already in. Redirect to
     * the default path in account in that case.
     */
    const isVpn = app === APPS.PROTONVPN_SETTINGS;
    const toApp = isVpn ? APPS.PROTONACCOUNT : app;
    const to = isVpn ? getSlugFromApp(APPS.PROTONVPN_SETTINGS) : '/';
    const prefixPath = `/${appSlug}`;

    const logo = (
        <AppLink
            to={to}
            toApp={toApp}
            target="_self"
            className="relative interactive-pseudo-protrude interactive--no-background"
        >
            <Logo appName={app} />
        </AppLink>
    );

    const top = <TopBanners app={app} />;

    const header = (
        <PrivateHeader
            userDropdown={<UserDropdown />}
            // No onboarding in account
            upsellButton={<TopNavbarUpsell offerProps={{ ignoreOnboarding: true }} app={app} />}
            title={c('Title').t`Settings`}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isNarrow={isNarrow}
            searchBox={<SettingsSearch routes={routes} path={prefixPath} app={app} />}
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
    const anyAccountAppRoute = getRoutePaths(prefixPath, Object.values(routes.account.routes));
    const anyOrganizationAppRoute = getRoutePaths(
        prefixPath,
        Object.values(routes.organization.routes).filter((section) => {
            // Filter out the domains section, the route clashes with the _same_ route in the mail router when
            // it's not available and would take precedence in the routing. (E.g. for free users).
            return !(section === routes.organization.routes.domains && !getIsSectionAvailable(section));
        })
    );

    const redirect = (() => {
        if (loadingOrganization || loadingFeatures || loadingSubscription) {
            return <PrivateMainAreaLoading />;
        }

        if (app === APPS.PROTONPASS && !isPassSettingsEnabled) {
            return <Redirect to={`/${getSlugFromApp(DEFAULT_APP)}${getDefaultRedirect(routes.account)}`} />;
        }

        return <Redirect to={`/${appSlug}${getDefaultRedirect(routes.account)}`} />;
    })();

    if (getRequiresAddressSetup(app, user)) {
        const toPath = `/${stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(location.pathname))}`;
        return <Redirect to={`${SETUP_ADDRESS_PATH}?to=${app}&to-type=settings&to-path=${toPath}`} />;
    }

    return (
        <PrivateAppContainer top={top} header={header} sidebar={sidebar}>
            <AccountStartupModals />
            <Switch>
                <Route path={anyAccountAppRoute}>
                    <AccountSettingsRouter
                        isPassPlusEnabled={isPassPlusEnabled}
                        app={app}
                        path={prefixPath}
                        accountAppRoutes={routes.account}
                        redirect={redirect}
                    />
                </Route>
                <Route path={anyOrganizationAppRoute}>
                    <OrganizationSettingsRouter
                        app={app}
                        path={prefixPath}
                        organizationAppRoutes={routes.organization}
                        redirect={redirect}
                        isOrgSpamBlockListEnabled={isOrgSpamBlockListEnabled}
                    />
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
                                loadingFeatures={loadingFeatures}
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
                {isPassSettingsEnabled && (
                    <Route path={`/${passSlug}`}>
                        <Suspense fallback={<PrivateMainAreaLoading />}>
                            <PassSettingsRouter passAppRoutes={routes.pass} redirect={redirect} />
                        </Suspense>
                    </Route>
                )}
                {redirect}
            </Switch>
        </PrivateAppContainer>
    );
};

export default MainContainer;
