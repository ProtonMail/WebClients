import { ReactNode } from 'react';
import { Route, Switch, useRouteMatch, useLocation } from 'react-router-dom';
import { PrivateMainSettingsArea, ThemesSection } from '@proton/components';
import { getSectionPath } from '@proton/components/containers/layout/helper';

import { getDriveAppRoutes } from './routes';

const DriveSettingsRouter = ({
    driveAppRoutes,
    redirect,
}: {
    driveAppRoutes: ReturnType<typeof getDriveAppRoutes>;
    redirect: ReactNode;
}) => {
    const { path } = useRouteMatch();
    const location = useLocation();

    const {
        routes: { general },
    } = driveAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, general)}>
                <PrivateMainSettingsArea config={general} location={location}>
                    <ThemesSection />
                </PrivateMainSettingsArea>
            </Route>
            {redirect}
        </Switch>
    );
};

export default DriveSettingsRouter;
