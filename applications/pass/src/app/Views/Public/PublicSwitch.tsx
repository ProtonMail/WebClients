import { Route, Switch } from 'react-router-dom';

import { UnauthorizedRoutes } from '@proton/pass/components/Navigation/routing';

import { Lobby } from './Lobby';
import { SecureLink } from './SecureLink';

export const PublicSwitch = () => (
    <Switch>
        <Route path={UnauthorizedRoutes.SecureLink} component={SecureLink} />
        <Route component={Lobby} />
    </Switch>
);
