import { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { PrivateMainSettingsArea, RetentionDaysSection } from '@proton/components';
import { getSectionPath } from '@proton/components/containers/layout/helper';

import type { getDriveAppRoutes } from './routes';

const DriveSettingsRouter = ({
    driveAppRoutes,
    redirect,
}: {
    driveAppRoutes: ReturnType<typeof getDriveAppRoutes>;
    redirect: ReactNode;
}) => {
    const { path } = useRouteMatch();

    const {
        routes: { revisions },
    } = driveAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, revisions)}>
                <PrivateMainSettingsArea config={revisions}>
                    <RetentionDaysSection />
                </PrivateMainSettingsArea>
            </Route>
            {redirect}
        </Switch>
    );
};

export default DriveSettingsRouter;
