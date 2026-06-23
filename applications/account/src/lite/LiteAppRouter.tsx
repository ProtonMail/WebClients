import type { ReactNode } from 'react';
import { lazy } from 'react';
import { Route, Switch } from 'react-router-dom';

import { getIsSectionAvailable } from '@proton/components/containers/layout/helper';
import { StandardErrorPage } from '@proton/components/index';

import { useAccountSettingRoutes } from './actions/account-settings/useAccountSettingRoutes';

const LazyRecoveryPage = lazy(
    () =>
        import(
            /* webpackChunkName: "RecoveryPage" */
            /* webpackPrefetch: true */
            /* webpackPreload: true */
            /* webpackFetchPriority: "high" */
            './actions/account-settings/recovery/RecoveryPage'
        )
);

const LazyReferralPage = lazy(
    () =>
        import(
            /* webpackChunkName: "ReferralPage" */
            /* webpackPrefetch: true */
            /* webpackPreload: true */
            /* webpackFetchPriority: "high" */
            './actions/account-settings/referral/ReferralPage'
        )
);

const LazyNotificationsPage = lazy(
    () =>
        import(
            /* webpackChunkName: "NotificationsPage" */
            /* webpackPrefetch: true */
            /* webpackPreload: true */
            /* webpackFetchPriority: "high" */
            './actions/account-settings/notifications/NotificationsPage'
        )
);

const LazyPrivacyPage = lazy(
    () =>
        import(
            /* webpackChunkName: "PrivacyPage" */
            /* webpackPrefetch: true */
            /* webpackPreload: true */
            /* webpackFetchPriority: "high" */
            './actions/account-settings/privacy/PrivacyPage'
        )
);

interface Props {
    loader: ReactNode;
}

const LiteAppRouter = ({ loader }: Props) => {
    const { loading, routes } = useAccountSettingRoutes();

    if (loading) {
        return loader;
    }
    return (
        <Switch>
            {getIsSectionAvailable(routes.recovery) && (
                <Route path={routes.recovery.to}>
                    <LazyRecoveryPage routeConfig={routes.recovery} />
                </Route>
            )}
            {getIsSectionAvailable(routes.referral) && (
                <Route path={routes.referral.to}>
                    <LazyReferralPage routeConfig={routes.referral} />
                </Route>
            )}
            {getIsSectionAvailable(routes.notifications) && (
                <Route path={routes.notifications.to}>
                    <LazyNotificationsPage routeConfig={routes.notifications} />
                </Route>
            )}
            {getIsSectionAvailable(routes.privacy) && (
                <Route path={routes.privacy.to}>
                    <LazyPrivacyPage routeConfig={routes.privacy} />
                </Route>
            )}
            <Route path={'*'}>
                <StandardErrorPage>No action parameter found.</StandardErrorPage>
            </Route>
        </Switch>
    );
};

export default LiteAppRouter;
