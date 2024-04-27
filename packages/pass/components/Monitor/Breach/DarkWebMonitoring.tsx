import { type FC } from 'react';
import { Route, type RouteChildrenProps, Switch } from 'react-router-dom';

import { BreachListPage } from './BreachListPage';

export const DarkWebMonitoring: FC<RouteChildrenProps> = ({ match }) => {
    if (!match) return;

    return (
        <Switch>
            <Route exact path={match.path} component={BreachListPage} />
        </Switch>
    );
};
