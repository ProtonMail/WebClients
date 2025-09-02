import type { FC } from 'react';
import { Route, Switch } from 'react-router-dom';

import { getLocalPath } from '@proton/pass/components/Navigation/routing';

import { HeaderMain } from './HeaderMain';
import { HeaderMonitor } from './HeaderMonitor';
import { HeaderSettings } from './HeaderSettings';
import type { HeaderProps } from './types';

export const Header: FC<HeaderProps> = (props) => (
    <Switch>
        <Route path={getLocalPath('monitor')}>{(subRoute) => <HeaderMonitor {...subRoute} {...props} />}</Route>
        <Route path={getLocalPath('settings')}>{() => <HeaderSettings {...props} />}</Route>
        <Route>{() => <HeaderMain {...props} />}</Route>
    </Switch>
);
