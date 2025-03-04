import type { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { PassEvents, PassPolicies, PrivateMainSettingsArea } from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import { PassReports } from '@proton/components/containers/pass/reports/PassReports';
import { PassBridgeProvider } from '@proton/pass/lib/bridge/PassBridgeProvider';

import PassDownloadsSettingsPage from './pages/PassDownloadsSettingsPage';
import type { getPassAppRoutes } from './routes';

const PassSettingsRouter = ({
    passAppRoutes,
    redirect,
}: {
    passAppRoutes: ReturnType<typeof getPassAppRoutes>;
    redirect: ReactNode;
}) => {
    const { path } = useRouteMatch();

    const {
        routes: { downloads, activityLogs, policies, reports },
    } = passAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, downloads)}>
                <PrivateMainSettingsArea config={downloads}>
                    <PassDownloadsSettingsPage />
                </PrivateMainSettingsArea>
            </Route>
            {getIsSectionAvailable(activityLogs) && (
                <Route path={getSectionPath(path, activityLogs)}>
                    <PrivateMainSettingsArea config={activityLogs}>
                        <PassEvents />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(policies) && (
                <Route path={getSectionPath(path, policies)}>
                    <PrivateMainSettingsArea config={policies}>
                        <PassBridgeProvider>
                            <PassPolicies />
                        </PassBridgeProvider>
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(reports) && (
                <Route path={getSectionPath(path, reports)}>
                    <PrivateMainSettingsArea config={reports}>
                        <PassBridgeProvider>
                            <PassReports />
                        </PassBridgeProvider>
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {redirect}
        </Switch>
    );
};

export default PassSettingsRouter;
