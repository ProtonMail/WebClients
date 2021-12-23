import { Route, Redirect, Switch, useRouteMatch, useLocation } from 'react-router-dom';

import DriveGeneralSettings from './DriveGeneralSettings';

const DriveSettingsRouter = ({ redirect }: { redirect: string }) => {
    const { path } = useRouteMatch();
    const location = useLocation();

    return (
        <Switch>
            <Route path={`${path}/general`}>
                <DriveGeneralSettings location={location} />
            </Route>
            <Redirect to={redirect} />
        </Switch>
    );
};

export default DriveSettingsRouter;
