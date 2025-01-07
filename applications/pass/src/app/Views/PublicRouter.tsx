import { type FC, memo } from 'react';
import { Route, Switch } from 'react-router-dom';

import { PublicRoutes } from '@proton/pass/components/Navigation/routing';

import { Lobby } from './Public/Lobby';
import { SecureLink } from './Public/SecureLink';

export const PublicRouter: FC = memo(() => (
    <Switch>
        <Route path={PublicRoutes.SecureLink} component={SecureLink} />
        <Route component={Lobby} />
    </Switch>
));

PublicRouter.displayName = 'PublicRouterMemo';
