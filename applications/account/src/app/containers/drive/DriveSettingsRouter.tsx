import type { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { B2BPhotosSection, PrivateMainSettingsArea, RetentionDaysSection } from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

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
        routes: { revisions, photos },
    } = driveAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, revisions)}>
                <PrivateMainSettingsArea config={revisions}>
                    <RetentionDaysSection />
                </PrivateMainSettingsArea>
            </Route>
            {getIsSectionAvailable(photos) && (
                <Route path={getSectionPath(path, photos)}>
                    <PrivateMainSettingsArea config={photos}>
                        <B2BPhotosSection />
                    </PrivateMainSettingsArea>
                </Route>
            )}
            {redirect}
        </Switch>
    );
};

export default DriveSettingsRouter;
