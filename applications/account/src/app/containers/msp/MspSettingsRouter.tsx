import type { ReactNode } from 'react';
import { Route, Switch } from 'react-router-dom';

import { PrivateMainSettingsArea } from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

import type { getMspAppRoutes } from './routes';

const MspSettingsRouter = ({
    path,
    mspAppRoutes,
    redirect,
}: {
    path: string;
    mspAppRoutes: ReturnType<typeof getMspAppRoutes>;
    redirect: ReactNode;
}) => {
    const {
        routes: { companies, monthlyCosts },
    } = mspAppRoutes;

    if (!mspAppRoutes.available) {
        return <>{redirect}</>;
    }

    return (
        <Switch>
            {getIsSectionAvailable(companies) && (
                <Route path={getSectionPath(path, companies)}>
                    <PrivateMainSettingsArea config={companies}>Companies</PrivateMainSettingsArea>
                </Route>
            )}
            {getIsSectionAvailable(monthlyCosts) && (
                <Route path={getSectionPath(path, monthlyCosts)}>
                    <PrivateMainSettingsArea config={monthlyCosts}>Monthly Costs</PrivateMainSettingsArea>
                </Route>
            )}
            {redirect}
        </Switch>
    );
};

export default MspSettingsRouter;
