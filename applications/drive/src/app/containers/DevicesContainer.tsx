import type { RouteComponentProps } from 'react-router-dom';
import { Redirect, Route, Switch } from 'react-router-dom';

import DevicesView from '../components/sections/Devices/DevicesView';

const DevicesContainer = ({ match }: RouteComponentProps) => {
    return (
        <Switch>
            <Route path={match.url} exact component={DevicesView} />
            <Redirect to="/devices" />
        </Switch>
    );
};

export default DevicesContainer;
