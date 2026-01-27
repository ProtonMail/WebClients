import type { FC } from 'react';
import type { RouteChildrenProps } from 'react-router-dom';
import { Route, Switch } from 'react-router-dom';

import { Items } from '@proton/pass/components/Item/Items';
import { Monitor } from '@proton/pass/components/Monitor/Monitor';

export const Router: FC<RouteChildrenProps> = ({ match, ...rest }) => {
    return (
        <Switch>
            <Route key="monitor" path={`${match?.path}/monitor`}>
                <Monitor match={match} {...rest} />
            </Route>
            <Route key="items" component={Items} />,
        </Switch>
    );
};
