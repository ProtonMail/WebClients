import { type FC, useLayoutEffect, useRef } from 'react';
import { Route, type RouteChildrenProps, Switch } from 'react-router-dom';

import { Scroll } from '@proton/atoms/Scroll';

import { Breach } from './Breach';
import { BreachGroup } from './BreachGroup';
import { Breaches } from './Breaches';

export const DarkWebMonitoring: FC<RouteChildrenProps> = ({ match, history }) => {
    const scrollRef = useRef<HTMLElement>(null);
    useLayoutEffect(() => scrollRef.current?.scrollTo({ top: 0 }), [history.location.pathname]);

    return match ? (
        <Scroll className="flex-1 w-full" customContainerRef={scrollRef}>
            <div className="h-full gap-4 max-w-custom p-6" style={{ '--max-w-custom': '80em' }}>
                <Switch>
                    <Route exact path={match.path} component={Breaches} />
                    <Route exact path={`${match.path}/:type`} component={BreachGroup} />
                    <Route exact path={`${match.path}/:type/:addressId/:breachId?`} component={Breach} />
                </Switch>
            </div>
        </Scroll>
    ) : null;
};
