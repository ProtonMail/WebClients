import { type FC, memo } from 'react';
import { Route, Switch } from 'react-router-dom';

import { PublicRoutes } from '@proton/pass/components/Navigation/routing';

import { AddAccount } from './Public/AddAccount';
import { DeviceLogin } from './Public/DeviceLogin';
import { Lobby } from './Public/Lobby';
import { SecureLink } from './Public/SecureLink';

export const PublicRouter: FC = memo(() => (
    <Switch>
        <Route path={PublicRoutes.SecureLink} component={SecureLink} />
        <Route path={PublicRoutes.AddAccount} component={AddAccount} />
        <Route path={PublicRoutes.DeviceLogin} component={DeviceLogin} />
        <Route component={Lobby} />
    </Switch>
));

PublicRouter.displayName = 'PublicRouterMemo';
