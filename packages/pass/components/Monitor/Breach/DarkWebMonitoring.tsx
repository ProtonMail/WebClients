import { type FC } from 'react';
import { Route, type RouteChildrenProps, Switch } from 'react-router-dom';

import { Scroll } from '@proton/atoms/Scroll';

import { Breach } from './Breach';
import { BreachGroup } from './BreachGroup';
import { Breaches } from './Breaches';

export const DarkWebMonitoring: FC<RouteChildrenProps> = ({ match }) => {
    if (!match) return;

    return (
        <Scroll className="flex-1 w-full">
            <div className="h-full gap-4 max-w-custom pt-6 px-6" style={{ '--max-w-custom': '80em' }}>
                <Switch>
                    <Route exact path={match.path} component={Breaches} />
                    <Route exact path={`${match.path}/:type`} component={BreachGroup} />
                    <Route exact path={`${match.path}/:type/:addressId/:breachId?`} component={Breach} />
                </Switch>
            </div>
        </Scroll>
    );
};
