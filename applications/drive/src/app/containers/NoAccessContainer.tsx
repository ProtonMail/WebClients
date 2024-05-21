import { Redirect, Route, RouteComponentProps, Switch } from 'react-router-dom';

import { NoAccessView } from '../components/sections/Drive/NoAccessView';

const NoAccessContainer = ({ match }: RouteComponentProps) => {
    return (
        <Switch>
            <Route path={match.url} exact component={NoAccessView} />
            <Redirect to="/" />
        </Switch>
    );
};

export default NoAccessContainer;
