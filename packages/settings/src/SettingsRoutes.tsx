import type { ComponentProps } from 'react';
import { Suspense, lazy } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

import { getTrustedContactRoute } from '@proton/account/delegatedAccess/routes';
import ContactEmailsProvider from '@proton/components/containers/contacts/ContactEmailsProvider';
import PrivateMainAreaLoading from '@proton/components/containers/layout/PrivateMainAreaLoading';
import { getIsSectionAvailable, getRoutePaths } from '@proton/components/containers/layout/helper';
import { CancellationReminderSection } from '@proton/components/containers/payments/subscription/cancellationFlow/CancellationReminderSection';
import { CANCEL_ROUTE } from '@proton/components/containers/payments/subscription/cancellationFlow/helper';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { hasPaidPass } from '@proton/shared/lib/user/helpers';
import { useB2BAdminNavigation } from '@proton/vpn/contexts/navigation';

import SettingsSearch, { AutocompleteSettingsSearch } from './SettingsSearch';
import AccountSettingsRouter from './containers/account/AccountSettingsRouter';
import MspSettingsRouter from './containers/msp/MspSettingsRouter';
import OrganizationSettingsRouter from './containers/organization/OrganizationSettingsRouter';
import type { getRoutes } from './routes';

const MailSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/MailSettingsRouter" */ './containers/mail/MailSettingsRouter')
);
const CalendarSettingsRouter = lazy(
    () =>
        import(/* webpackChunkName: "routers/CalendarSettingsRouter" */ './containers/calendar/CalendarSettingsRouter')
);
const VpnSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/VpnSettingsRouter" */ './containers/vpn/VpnSettingsRouter')
);
const DriveSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/DriveSettingsRouter" */ './containers/drive/DriveSettingsRouter')
);
const DocsSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/DocsSettingsRouter" */ './containers/docs/DocsSettingsRouter')
);
const PassSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/PassSettingsRouter" */ './containers/pass/PassSettingsRouter')
);
const WalletSettingsRouter = lazy(
    () => import(/* webpackChunkName: "routers/WalletSettingsRouter" */ './containers/wallet/WalletSettingsRouter')
);

const mailSlug = getSlugFromApp(APPS.PROTONMAIL);
const calendarSlug = getSlugFromApp(APPS.PROTONCALENDAR);
const vpnSlug = getSlugFromApp(APPS.PROTONVPN_SETTINGS);
const driveSlug = getSlugFromApp(APPS.PROTONDRIVE);
const docsSlug = getSlugFromApp(APPS.PROTONDOCS);
const walletSlug = getSlugFromApp(APPS.PROTONWALLET);
const passSlug = getSlugFromApp(APPS.PROTONPASS);

type Routes = ReturnType<typeof getRoutes>;

const getDefaultPassRedirect = (user: UserModel, accountRoutes: Routes['account'], passRoutes: Routes['pass']) => {
    if (hasPaidPass(user) || !user.canPay || !getIsSectionAvailable(accountRoutes.routes.dashboard)) {
        return passRoutes.routes.downloads.to;
    }
    return accountRoutes.routes.dashboard.to;
};

const getDefaultMspRedirect = (organizationRoutes: Routes['organization']) => {
    return organizationRoutes.routes.users.to;
};

const getDefaultRedirect = (accountRoutes: Routes['account']) => {
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

export const SettingsSearchArea = ({ app, routes }: { app: APP_NAMES; routes: Routes }) => {
    const { viewportWidth } = useActiveBreakpoint();
    const adminSidebar = useB2BAdminNavigation();

    if (!viewportWidth['>=large']) {
        return null;
    }

    if (app === APPS.PROTONVPN_SETTINGS && adminSidebar.enabled) {
        return <AutocompleteSettingsSearch options={adminSidebar.settings} />;
    }

    return <SettingsSearch routes={routes} app={app} />;
};

type OrganizationSettingsRouterProps = ComponentProps<typeof OrganizationSettingsRouter>;

interface SettingsRoutesProps {
    app: APP_NAMES;
    appSlug: string;
    pathPrefix: string;
    user: UserModel;
    routes: Routes;
    /** Renders a loader instead of redirecting until the router params are known. */
    loading: boolean;
    organization: OrganizationSettingsRouterProps['organization'];
    entitlements: OrganizationSettingsRouterProps['entitlements'];
    onOpenChat: OrganizationSettingsRouterProps['onOpenChat'];
}

export const SettingsRoutes = ({
    app,
    appSlug,
    pathPrefix,
    user,
    routes,
    loading,
    organization,
    entitlements,
    onOpenChat,
}: SettingsRoutesProps) => {
    const location = useLocation();

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
    const anyMspAppRoute = getRoutePaths(pathPrefix, Object.values(routes.msp.routes));

    const redirect = (() => {
        if (loading) {
            return <PrivateMainAreaLoading />;
        }

        const path = (() => {
            if (!routes.account.available) {
                return getDefaultMspRedirect(routes.organization);
            }
            if (app === APPS.PROTONPASS) {
                return getDefaultPassRedirect(user, routes.account, routes.pass);
            }
            return getDefaultRedirect(routes.account);
        })();

        return <Redirect to={`${pathPrefix}${path}`} />;
    })();

    return (
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
                    to={`${appSlug}${routes.account.routes.recovery.to}${routes.account.routes.recovery.subrouteGroups.advancedRecovery.subroutes.emergencyContacts.to}${location.search}${location.hash}`}
                />
            </Route>
            <Route path={anyOrganizationAppRoute}>
                <OrganizationSettingsRouter
                    app={app}
                    path={pathPrefix}
                    organizationAppRoutes={routes.organization}
                    redirect={redirect}
                    organization={organization}
                    onOpenChat={onOpenChat}
                    entitlements={entitlements}
                />
            </Route>
            <Route path={anyMspAppRoute}>
                <MspSettingsRouter path={pathPrefix} mspAppRoutes={routes.msp} redirect={redirect} />
            </Route>
            <Route path={[`/${appSlug}${CANCEL_ROUTE}`, CANCEL_ROUTE]}>
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
                        <CalendarSettingsRouter user={user} calendarAppRoutes={routes.calendar} redirect={redirect} />
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
            {redirect}
        </Switch>
    );
};
