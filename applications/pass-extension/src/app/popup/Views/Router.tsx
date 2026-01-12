import { type FC, Suspense, lazy } from 'react';
import type { RouteChildrenProps } from 'react-router-dom';
import { Route, Switch } from 'react-router-dom';

import Loader from '@proton/components/components/loader/Loader';
import { Items } from '@proton/pass/components/Item/Items';

const Monitor = lazy(() => import(/* webpackChunkName: "monitor" */ '@proton/pass/components/Monitor/Monitor'));

export const Router: FC<RouteChildrenProps> = ({ match, ...rest }) => {
    return (
        <Switch>
            <Route key="monitor" path={`${match?.path}/monitor`}>
                <Suspense fallback={<Loader />}>
                    <Monitor match={match} {...rest} />
                </Suspense>
            </Route>
            <Route key="items" component={Items} />,
        </Switch>
    );
};
