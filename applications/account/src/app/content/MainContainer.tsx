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
import { getAppFromPathnameSafe, getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { getToApp } from '@proton/shared/lib/authentication/apps';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { getPathFromLocation } from '@proton/shared/lib/helpers/url';
import { UserModel } from '@proton/shared/lib/interfaces';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';
import { getRequiresAddressSetup } from '@proton/shared/lib/keys';
import { hasPaidPass } from '@proton/shared/lib/user/helpers';

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
    const [user] = useUser();
    const [userSettings] = useUserSettings();
    const [addresses] = useAddresses();
    const [organization, loadingOrganization] = useOrganization();
    const [subscription, loadingSubscription] = useSubscription();
    const location = useLocation();
    const { state: expanded, toggle: onToggleExpand, set: setExpand } = useToggle();
    const { isNarrow } = useActiveBreakpoint();

    const { featuresFlags, getFeature } = useFeatures([
        FeatureCode.ReferralProgram,
        FeatureCode.SmtpToken,
        FeatureCode.MailForwarding,
        FeatureCode.MailDisableE2EE,
        FeatureCode.CalendarSharingEnabled,
        FeatureCode.HolidaysCalendars,
        FeatureCode.EasySwitch,
        FeatureCode.OrgSpamBlockList,
        FeatureCode.ProtonSentinel,
        FeatureCode.OrgTwoFactor,
    ]);

    const referralProgramFeature = getFeature(FeatureCode.ReferralProgram);

    const isSmtpTokenEnabled = getFeature(FeatureCode.SmtpToken).feature?.Value === true;
    const isGmailSyncEnabled = getFeature(FeatureCode.EasySwitch).feature?.Value.GoogleMailSync === true;
    const isOrgSpamBlockListEnabled = getFeature(FeatureCode.OrgSpamBlockList).feature?.Value === true;
    const isProtonSentinelFeatureEnabled = getFeature(FeatureCode.ProtonSentinel).feature?.Value === true;
    const isOrgTwoFactorEnabled = getFeature(FeatureCode.OrgTwoFactor).feature?.Value === true;

    const [isDataRecoveryAvailable, loadingDataRecovery] = useIsDataRecoveryAvailable();
    const loadingFeatures = featuresFlags.some(({ loading }) => loading) || loadingDataRecovery;
    const recoveryNotification = useRecoveryNotification(false);

    const appFromPathname = getAppFromPathnameSafe(location.pathname);
    const app = appFromPathname || getToApp(undefined, user);
    const appSlug = getSlugFromApp(app);

    const routes = getRoutes({
        app,
        user,
        addresses,
        organization,
        subscription,
        isReferralProgramEnabled: referralProgramFeature?.feature?.Value && userSettings.Referral?.Eligible,
        isSmtpTokenEnabled,
        isDataRecoveryAvailable,
        isGmailSyncEnabled,
        recoveryNotification: recoveryNotification?.color,
        isOrgSpamBlockListEnabled,
        isProtonSentinelEligible:
            !!userSettings.HighSecurity.Eligible ||
            userSettings.HighSecurity.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED,
        isProtonSentinelFeatureEnabled,
        isOrgTwoFactorEnabled,
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
    const isLocal = [APPS.PROTONVPN_SETTINGS, APPS.PROTONPASS].includes(app as any);
    const toApp = isLocal ? APPS.PROTONACCOUNT : app;
    const to = isLocal ? `/${getSlugFromApp(app)}` : '/';
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

        if (!appFromPathname) {
            return <Redirect to={`/${appSlug}${getPathFromLocation(location)}`} />;
        }

        const path = (() => {
            if (app === APPS.PROTONPASS) {
                return getDefaultPassRedirect(user, routes.account, routes.pass);
            }
            return getDefaultRedirect(routes.account);
        })();

        return <Redirect to={`/${appSlug}${path}`} />;
    })();

    if (getRequiresAddressSetup(app, user)) {
        const toPath = `/${stripLeadingAndTrailingSlash(stripLocalBasenameFromPathname(location.pathname))}`;
        return <Redirect to={`${SETUP_ADDRESS_PATH}?to=${app}&to-type=settings&to-path=${toPath}`} />;
    }

    return (
        <PrivateAppContainer top={top} header={header} sidebar={sidebar}>
            <AccountStartupModals app={app} />
            <Switch>
                <Route path={anyAccountAppRoute}>
                    <AccountSettingsRouter
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
                        isOrgTwoFactorEnabled={isOrgTwoFactorEnabled}
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
                <Route path={`/${passSlug}`}>
                    <Suspense fallback={<PrivateMainAreaLoading />}>
                        <PassSettingsRouter passAppRoutes={routes.pass} redirect={redirect} />
                    </Suspense>
                </Route>
                {redirect}
            </Switch>
        </PrivateAppContainer>
    );
};

export default MainContainer;
