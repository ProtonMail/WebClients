import { type FC } from 'react';
import { Route, Switch } from 'react-router-dom';

import { useClient } from '../Context/ClientProvider';
import { Lobby } from './Lobby';
import { Main } from './Main';

export const Routes: FC = () => {
    const client = useClient();

    return (
        <Switch>
            <Route path="*" render={() => (client.state.loggedIn ? <Main /> : <Lobby />)} />
        </Switch>
    );
};
