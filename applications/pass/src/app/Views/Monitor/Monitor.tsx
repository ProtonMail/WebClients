import { type FC } from 'react';
import { Route, type RouteChildrenProps, Switch } from 'react-router-dom';

import { Scroll } from '@proton/atoms/Scroll';
import { DuplicatePasswords } from '@proton/pass/components/Monitor/Password/DuplicatePasswords';
import { Summary } from '@proton/pass/components/Monitor/Summary';

export const Monitor: FC<RouteChildrenProps> = ({ match }) => {
    return (
        <div className="flex flex-column justify-center w-full h-full">
            <Scroll className="flex-1 flex-column align-center w-full p-6">
                <Switch>
                    <Route exact path={`${match?.path}/duplicates`} component={DuplicatePasswords} />
                    <Route component={Summary} />
                </Switch>
            </Scroll>
        </div>
    );
};
